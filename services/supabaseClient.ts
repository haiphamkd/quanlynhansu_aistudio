import { createClient } from '@supabase/supabase-js';

// URL và Key bạn đã cung cấp
const PROVIDED_URL = 'https://pghoilgkweifpiyeiggn.supabase.co';
const PROVIDED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnaG9pbGdrd2VpZnBpeWVpZ2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MjczMTQsImV4cCI6MjA4MDUwMzMxNH0.T3XMFmZRS7ZUN8e8NQv8LG23Xwb_TgX1TMt9LwaJHEo';

// Hàm lấy biến môi trường an toàn
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env?.[key];
  } catch (e) {
    return undefined;
  }
};

// Ưu tiên biến môi trường, nếu không có thì dùng Key cứng
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || PROVIDED_URL;
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || PROVIDED_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
