import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://udionwmqmjcfzbdhoetv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaW9ud21xbWpjZnpiZGhvZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDI3NjcsImV4cCI6MjA5NjIxODc2N30.EP5bruNS55m2PE1nf0p2KeOxm4Tnae5ESAj6DukqIr0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Starting migration to Supabase...');

  // 1. Load Bridges
  try {
    const bridgesPath = path.join(process.cwd(), 'public', 'data', 'bridges.json');
    const bridgesData = JSON.parse(fs.readFileSync(bridgesPath, 'utf8'));
    
    console.log(`Loaded ${bridgesData.length} bridges from JSON.`);
    
    // Format for our table (id, data)
    const bridgesToInsert = bridgesData.map(b => ({
      id: b.BridgeNumber,
      data: b
    }));

    const { data: bData, error: bError } = await supabase
      .from('bridges')
      .upsert(bridgesToInsert);

    if (bError) {
      console.error('Error inserting bridges:', bError);
      return;
    }
    console.log('Bridges successfully migrated to Supabase!');

  } catch (err) {
    console.error('Failed processing bridges:', err.message);
  }

  // 2. Load Culverts
  try {
    const culvertsPath = path.join(process.cwd(), 'public', 'data', 'culverts.json');
    const culvertsData = JSON.parse(fs.readFileSync(culvertsPath, 'utf8'));
    
    console.log(`Loaded ${culvertsData.length} culverts from JSON.`);
    
    const culvertsToInsert = culvertsData.map(c => ({
      id: c.CulvertNumber,
      data: c
    }));

    const { data: cData, error: cError } = await supabase
      .from('culverts')
      .upsert(culvertsToInsert);

    if (cError) {
      console.error('Error inserting culverts:', cError);
    } else {
      console.log('Culverts successfully migrated to Supabase!');
    }

  } catch (err) {
    console.error('Failed processing culverts:', err.message);
  }
}

migrate();
