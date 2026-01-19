import { openDB } from 'idb';
import type { Question } from '../types';

const DB_NAME = 'MathBaseDB';
const STORE_NAME = 'game_details';

// เปิด/สร้าง Database
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      // สร้าง Object Store โดยใช้ 'id' เป็น Key (ซึ่งจะตรงกับ ID ใน Supabase)
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const localDB = {
  // บันทึกรายละเอียดโจทย์ลงเครื่อง (ใช้ ID เดียวกับ Supabase)
  saveDetails: async (id: string, questions: Question[]) => {
    const db = await initDB();
    await db.put(STORE_NAME, { id, questions });
  },

  // ดึงรายละเอียดโจทย์จากเครื่อง
  getDetails: async (id: string) => {
    const db = await initDB();
    const data = await db.get(STORE_NAME, id);
    return data?.questions || null;
  },

  // (Optional) ลบข้อมูลเก่าถ้าเยอะเกินไป
  clearOldData: async () => {
    // Logic การเคลียร์ถ้าจำเป็น
  }
};