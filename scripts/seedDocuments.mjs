import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_REST_URL || 'https://udionwmqmjcfzbdhoetv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const metadataPath = path.resolve('public', 'data', 'extracted_metadata.json');
  const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

  console.log(`Starting seeding of ${metadata.length} items...`);

  for (const item of metadata) {
    try {
      const isPhoto = item.type === 'PHOTO';
      const bucket = isPhoto ? 'photos' : 'documents';
      
      const fileBuffer = await fs.readFile(item.filepath);
      
      // Ensure unique filename
      const uniqueName = `${Date.now()}_${item.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Upload to Storage
      console.log(`Uploading ${uniqueName} to ${bucket}...`);
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(uniqueName, fileBuffer, { upsert: true });

      if (uploadError) {
        console.error(`Error uploading ${item.filename}:`, uploadError);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(uniqueName);
      const storageUrl = publicUrlData.publicUrl;

      // Insert into DB
      if (isPhoto) {
        // Find parent document if exists
        let parentDocId = null;
        if (item.parent_file) {
          const { data: parentDocs } = await supabase
            .from('documents')
            .select('id')
            .eq('filename', item.parent_file)
            .limit(1);
          if (parentDocs && parentDocs.length > 0) {
            parentDocId = parentDocs[0].id;
          }
        }

        const { error: dbError } = await supabase
          .from('document_photos')
          .insert({
            document_id: parentDocId,
            filename: item.filename,
            storage_url: storageUrl
          });
        if (dbError) console.error(`DB Insert Error for ${item.filename}:`, dbError);

      } else {
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            filename: item.filename,
            file_type: item.type,
            snippet: item.snippet,
            size_mb: item.size_mb,
            storage_url: storageUrl
          });
        if (dbError) console.error(`DB Insert Error for ${item.filename}:`, dbError);
      }
      
    } catch (err) {
      console.error(`Failed processing ${item.filename}:`, err.message);
    }
  }

  console.log('Seeding complete!');
}

main().catch(console.error);
