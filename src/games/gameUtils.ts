// สุ่มจำนวนเต็ม
export const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// แปลงเลขฐาน (แสดงผลเป็น String ตัวใหญ่)
export const toBase = (num: number, base: number) => num.toString(base).toUpperCase();

// ✅ เพิ่ม Interface นี้เข้าไปเพื่อให้ไฟล์อื่นเรียกใช้ได้ครับ
export interface ArcadeQuestion {
  id?: number;      // Optional: เพราะตอนสร้างโจทย์ยังไม่มี ID แต่ตอนเล่นเกมจะมี
  display: string;  // โจทย์ที่แสดง (เช่น "10 + 10")
  answer: string;   // คำตอบที่ถูกต้อง (เช่น "20")
  value: number;    // ค่าจริงทางคณิตศาสตร์ (เช่น 20)
}

// Config ความยาก
export const getDifficultyConfig = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy': return { maxVal: 15, ops: ['+'], speedMod: 1, scoreMod: 1 };
    case 'medium': return { maxVal: 50, ops: ['+', '-'], speedMod: 1.5, scoreMod: 2 };
    case 'hard': return { maxVal: 255, ops: ['+', '-', '*', '%'], speedMod: 2.5, scoreMod: 3 };
  }
};

// ตัวสร้างโจทย์
export const generateQuestion = (currentBase: number, difficulty: 'easy' | 'medium' | 'hard'): ArcadeQuestion => {
  const { maxVal, ops } = getDifficultyConfig(difficulty);
  const op = ops[randomInt(0, ops.length - 1)];
  
  let a = randomInt(1, maxVal);
  let b = randomInt(1, maxVal);
  let result = 0;

  if (op === '+') result = a + b;
  else if (op === '-') { if (b > a) [a, b] = [b, a]; result = a - b; }
  else if (op === '*') { a = randomInt(2, 12); b = randomInt(2, 12); result = a * b; }
  else if (op === '%') { b = randomInt(2, 10); result = a % b; }

  return {
    display: `${toBase(a, currentBase)} ${op} ${toBase(b, currentBase)}`,
    answer: toBase(result, currentBase),
    value: result
  };
};