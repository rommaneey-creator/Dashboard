export interface SurveyQuestion {
  key: 'q1' | 'q2' | 'q3' | 'q4' | 'q5';
  label: string;
  description: string;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    key: 'q1',
    label: '1. เนื้อหาการอบรมมีประโยชน์และตรงตามความต้องการ',
    description: 'ความเหมาะสมของเนื้อหาและการนำไปใช้จริง',
  },
  {
    key: 'q2',
    label: '2. วิทยากรถ่ายทอดได้ชัดเจน น่าสนใจ และตอบคำถามได้ดี',
    description: 'ทักษะการสื่อสารและการสร้างการมีส่วนร่วม',
  },
  {
    key: 'q3',
    label: '3. เอกสารประกอบและสื่อการสอนมีความชัดเจน',
    description: 'ความครบถ้วนและอ่านง่ายของสไลด์หรือคู่มือ',
  },
  {
    key: 'q4',
    label: '4. สถานที่ ระบบออนไลน์ และการอำนวยความสะดวก',
    description: 'ความพร้อมของอุปกรณ์ เสียง และการจัดเตรียมงาน',
  },
  {
    key: 'q5',
    label: '5. ความพึงพอใจโดยรวมต่อการอบรมครั้งนี้',
    description: 'ภาพรวมความประทับใจตลอดหลักสูตร',
  },
];

export const SCORE_LABELS: Record<number, string> = {
  1: 'น้อยที่สุด',
  2: 'น้อย',
  3: 'ปานกลาง',
  4: 'มาก',
  5: 'มากที่สุด',
};

export interface SurveyResponseRecord {
  id: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  comment?: string;
  deviceToken: string;
  createdAtMs: number;
}

export function interpretAverageScore(avg: number): {
  level: string;
  colorClass: string;
} {
  if (avg >= 4.5) {
    return { level: 'มากที่สุด', colorClass: 'text-emerald-700' };
  }
  if (avg >= 3.5) {
    return { level: 'มาก', colorClass: 'text-teal-700' };
  }
  if (avg >= 2.5) {
    return { level: 'ปานกลาง', colorClass: 'text-amber-700' };
  }
  if (avg >= 1.5) {
    return { level: 'น้อย', colorClass: 'text-orange-700' };
  }
  return { level: 'น้อยที่สุด', colorClass: 'text-rose-700' };
}
