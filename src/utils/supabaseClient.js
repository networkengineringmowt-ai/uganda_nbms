import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://udionwmqmjcfzbdhoetv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaW9ud21xbWpjZnpiZGhvZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDI3NjcsImV4cCI6MjA5NjIxODc2N30.EP5bruNS55m2PE1nf0p2KeOxm4Tnae5ESAj6DukqIr0';

export const supabase = createClient(supabaseUrl, supabaseKey);
