import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_REST_URL || 'https://udionwmqmjcfzbdhoetv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function emptyBucket(bucketName) {
  console.log(`Emptying bucket: ${bucketName}...`);
  let hasMore = true;
  let offset = 0;
  let totalDeleted = 0;

  while (hasMore) {
    const { data: files, error } = await supabase.storage.from(bucketName).list('', {
      limit: 100,
      offset: 0 // offset 0 because we delete them as we go
    });

    if (error) {
      console.error(`Error listing files in ${bucketName}:`, error);
      break;
    }

    if (!files || files.length === 0) {
      hasMore = false;
      break;
    }

    // Filter out placeholder files like .emptyFolderPlaceholder
    const filesToRemove = files.map(x => x.name);
    
    console.log(`Found ${filesToRemove.length} files. Deleting...`);
    const { data, error: removeError } = await supabase.storage.from(bucketName).remove(filesToRemove);
    
    if (removeError) {
      console.error(`Error deleting files from ${bucketName}:`, removeError);
      break;
    }

    totalDeleted += filesToRemove.length;
    console.log(`Deleted ${totalDeleted} files so far from ${bucketName}.`);
  }

  console.log(`Successfully emptied bucket: ${bucketName}. Total deleted: ${totalDeleted}`);
}

async function emptyTables() {
  console.log('Emptying database tables...');
  
  // Truncate bridges and culverts
  await supabase.from('bridges').delete().neq('id', '0');
  await supabase.from('culverts').delete().neq('id', '0');
  
  // document_photos and documents
  await supabase.from('document_photos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Successfully emptied database tables.');
}

async function main() {
  try {
    await emptyBucket('photos');
    await emptyBucket('documents');
    await emptyTables();
    console.log('Cleanup complete!');
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

main();
