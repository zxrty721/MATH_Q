// Utility Functions
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// แปลงเลขเป็นฐานต่างๆ และทำเป็นตัวใหญ่ (เช่น 10 ฐาน 16 -> "A")
const toBase = (num: number, base: number) => num.toString(base).toUpperCase();

export interface ArcadeQuestion {
  question: string;
  answer: string;
  choices: string[];
  value: number;
}

export interface GameConfig {
  spawnSpeed: number;
  fallSpeed: number;
  timeLimit: number;
  scoreMultiplier: number;
}

// Config ความยาก (คุมความเร็วและเวลา)
export const getGameConfig = (difficulty: 'easy' | 'medium' | 'hard'): GameConfig => {
  switch (difficulty) {
    case 'easy': return { spawnSpeed: 4, fallSpeed: 12, timeLimit: 90, scoreMultiplier: 1 };
    case 'medium': return { spawnSpeed: 2.5, fallSpeed: 7, timeLimit: 60, scoreMultiplier: 2 };
    case 'hard': return { spawnSpeed: 1.5, fallSpeed: 4, timeLimit: 45, scoreMultiplier: 4 };
  }
};

export const generateArcadeProblem = (currentBase: number, difficulty: 'easy' | 'medium' | 'hard'): ArcadeQuestion => {
  
  // 1. CONFIG ความยาก
  const settings = {
    easy:   { max: 15,  ops: ['+'] }, 
    medium: { max: 50,  ops: ['+', '-'] },
    hard:   { max: 255, ops: ['+', '-', '*', '%'] } 
  };
  
  const { max, ops } = settings[difficulty];
  
  // === โหมดคำนวณล้วน (ตัด Convert ทิ้งเพื่อความ Strict) ===
  const op = ops[randomInt(0, ops.length - 1)];
  
  // สุ่มตัวเลข (คำนวณฐาน 10 ก่อนเพื่อความชัวร์)
  let valA = randomInt(1, max);
  let valB = randomInt(1, max);
  let result = 0;

  if (op === '+') {
    result = valA + valB;
  } else if (op === '-') {
    if (valB > valA) [valA, valB] = [valB, valA]; // สลับไม่ให้ติดลบ
    result = valA - valB;
  } else if (op === '*') {
    // คูณ: ลดตัวเลขลงหน่อย ผลลัพธ์จะได้ไม่ล้น
    const limit = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 8 : 12;
    valA = randomInt(2, limit);
    valB = randomInt(2, limit);
    result = valA * valB;
  } else if (op === '%') { 
    valB = randomInt(2, 10);
    result = valA % valB;
  }

  // สร้างโจทย์: แปลงเลขทุกตัวเป็นฐานที่เลือกเท่านั้น!
  const strA = toBase(valA, currentBase);
  const strB = toBase(valB, currentBase);
  
  const questionText = `${strA} ${op} ${strB} = ?`;
  const answerText = toBase(result, currentBase);

  // --- สร้างตัวเลือกหลอก (Choices) ---
  const choices = new Set<string>();
  choices.add(answerText);

  let safety = 0;
  while (choices.size < 4 && safety < 50) {
    let offset = randomInt(1, difficulty === 'easy' ? 3 : 15);
    if (Math.random() > 0.5) offset *= -1;
    
    let fakeVal = result + offset;
    if (fakeVal < 0) fakeVal = 0;
    
    const fakeStr = toBase(fakeVal, currentBase);

    if (fakeStr !== answerText) {
      choices.add(fakeStr);
    }
    safety++;
  }
  
  while(choices.size < 4) {
     choices.add(toBase(result + choices.size + 1, currentBase));
  }

  return {
    question: questionText,
    answer: answerText,
    choices: Array.from(choices).sort(() => Math.random() - 0.5),
    value: result
  };
};