import { createClient } from '@supabase/supabase-js';

// อ่านค่าจาก .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// เช็คว่ามีค่าไหม? ถ้าไม่มีให้แจ้งเตือนที่ Console แต่ไม่ให้แอปพัง
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase URL or Key is missing! Check your .env file.');
}

// สร้าง Client (ถ้าไม่มี URL ให้ใช้ string ว่างๆ ไปก่อนเพื่อกัน error หน้าขาว)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);