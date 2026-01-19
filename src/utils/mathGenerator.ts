import type { Question, GameConfig } from '../types';

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (array: string[]) => array.sort(() => Math.random() - 0.5);
const toBase = (num: number, base: number) => num.toString(base).toUpperCase();

export const generateQuestion = (config: GameConfig): Question => {
  const { mode, difficulty: diff, base } = config;
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

  let min = 1, max = 10;
  if (diff === 'medium') { min = 10; max = 50; }
  if (diff === 'hard') { min = 50; max = 150; }
  if (base === 2) max = Math.ceil(max / 3); // ลดเลขฐาน 2 ลงหน่อย

  switch (mode) {
    case 'addition': return genBasicOp(id, base, '+', min, max);
    case 'subtraction': return genBasicOp(id, base, '-', min, max);
    case 'multiplication': return genBasicOp(id, base, '*', Math.ceil(min/2), Math.ceil(max/2));
    case 'division': return genBasicOp(id, base, '/', 2, Math.min(12, max));
    case 'equation': return genEquation(id, base, max);
    case 'area': return genArea(id, base, min, max);
    case 'linear': return genLinear(id, base);
    case 'quadratic': return genQuadratic(id, base);
    default: return genBasicOp(id, base, '+', min, max);
  }
};

const genBasicOp = (id: string, base: number, op: string, min: number, max: number): Question => {
  let a = random(min, max);
  let b = random(min, max);
  let ans = 0;

  if (op === '+') ans = a + b;
  if (op === '-') { if (a < b) [a, b] = [b, a]; ans = a - b; }
  if (op === '*') ans = a * b;
  if (op === '/') { ans = random(min, max); a = b * ans; }

  const display = `${toBase(a, base)} ${op === '*' ? '×' : op === '/' ? '÷' : op} ${toBase(b, base)} = ?`;
  return formatQuestion(id, display, ans, base);
};

const genEquation = (id: string, base: number, max: number): Question => {
  const x = random(1, 15);
  const a = random(2, 5);
  const b = random(1, max);
  const c = a * x + b;
  return formatQuestion(id, `${toBase(a, base)}x + ${toBase(b, base)} = ${toBase(c, base)}`, x, base);
};

const genArea = (id: string, base: number, min: number, max: number): Question => {
  const w = random(min, max);
  const h = random(min, max);
  return formatQuestion(id, `กว้าง ${toBase(w, base)}, ยาว ${toBase(h, base)}, พื้นที่ = ?`, w * h, base);
};

const genLinear = (id: string, base: number): Question => {
  const m = random(1, 5);
  const c = random(1, 10);
  const x = random(1, 5);
  const y = m * x + c;
  return formatQuestion(id, `y = ${toBase(m, base)}x + ${toBase(c, base)}, x = ${toBase(x, base)}, y = ?`, y, base);
};

const genQuadratic = (id: string, base: number): Question => {
  const r1 = random(1, 5);
  const r2 = random(1, 5);
  const display = `x² - ${toBase(r1+r2, base)}x + ${toBase(r1*r2, base)} = 0`;
  const correct = `${toBase(Math.min(r1,r2), base)}, ${toBase(Math.max(r1,r2), base)}`;
  const distractors = [
    `${toBase(r1, base)}, ${toBase(-r2, base)}`,
    `${toBase(r1+1, base)}, ${toBase(r2+1, base)}`,
    `${toBase(r1-1, base)}, ${toBase(r2, base)}`
  ];
  return { id, display, subDisplay: `(ฐาน ${base})`, options: shuffle([correct, ...distractors]), correctAnswer: correct };
};

const formatQuestion = (id: string, display: string, ansVal: number, base: number): Question => {
  const correct = toBase(ansVal, base);
  const distractors = new Set<string>();
  while (distractors.size < 3) {
    const offset = random(1, 5) * (Math.random() > 0.5 ? 1 : -1);
    const dVal = Math.max(0, ansVal + offset);
    const dStr = toBase(dVal, base);
    if (dStr !== correct) distractors.add(dStr);
    if (base === 2 && distractors.size < 3) distractors.add(toBase(ansVal ^ 1, base));
  }
  return { id, display, subDisplay: `(คำนวณในฐาน ${base})`, options: shuffle([correct, ...Array.from(distractors)]), correctAnswer: correct };
};