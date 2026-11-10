import React, { useEffect, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { CheckCircle2, Send } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SCORE_LABELS, SURVEY_QUESTIONS } from '../surveyConfig';

const STORAGE_KEY = 'training_survey_submitted_v1';

function getOrCreateDeviceToken(): string {
  const existing = localStorage.getItem('training_survey_device_token');
  if (existing) return existing;
  const token = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem('training_survey_device_token', token);
  return token;
}

export default function SurveyPage() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setSubmitted(true);
    }
  }, []);

  const answeredCount = SURVEY_QUESTIONS.filter((q) => scores[q.key] >= 1).length;
  const allAnswered = answeredCount === SURVEY_QUESTIONS.length;

  const handleSelectScore = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) {
      setErrorMsg('กรุณาให้คะแนนให้ครบทั้ง 5 ข้อก่อนส่งแบบสอบถาม');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const responseId = `resp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const deviceToken = getOrCreateDeviceToken();
      const trimmedComment = comment.trim().slice(0, 1000);

      const payload: Record<string, unknown> = {
        q1: scores.q1,
        q2: scores.q2,
        q3: scores.q3,
        q4: scores.q4,
        q5: scores.q5,
        deviceToken,
        createdAt: serverTimestamp(),
      };

      if (trimmedComment.length > 0) {
        payload.comment = trimmedComment;
      }

      await setDoc(doc(db, 'responses', responseId), payload);
      localStorage.setItem(STORAGE_KEY, 'true');
      setSubmitted(true);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'responses');
      } catch {
        setErrorMsg('ไม่สามารถส่งข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            ขอบคุณสำหรับการประเมิน
          </h1>
          <p className="mt-2 text-base text-slate-600">
            ระบบได้บันทึกคำตอบของคุณเรียบร้อยแล้ว และผลคะแนนถูกอัปเดตบนหน้า Dashboard ทันที
          </p>
          <p className="mt-6 text-sm text-slate-500">
            เครื่องนี้ได้ส่งแบบประเมินเรียบร้อยแล้ว (จำกัด 1 ครั้งต่อเครื่อง)
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6 pb-20 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          แบบประเมินความพึงพอใจการอบรม
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          กรุณาให้คะแนนตั้งแต่ 1 (น้อยที่สุด) ถึง 5 (มากที่สุด) ไม่มีการเก็บชื่อหรือข้อมูลส่วนตัว
        </p>
        <div className="mt-3 text-sm font-medium text-teal-700 tabular-nums">
          ตอบแล้ว {answeredCount} / {SURVEY_QUESTIONS.length} ข้อ
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {SURVEY_QUESTIONS.map((q) => {
          const selected = scores[q.key];
          return (
            <section
              key={q.key}
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                {q.label}
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {q.description}
              </p>

              <div
                className="mt-4 grid grid-cols-5 gap-2"
                role="radiogroup"
                aria-label={q.label}
              >
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = selected === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectScore(q.key, val)}
                      aria-pressed={isSelected}
                      className={`flex min-h-[54px] flex-col items-center justify-center rounded-xl border text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                        isSelected
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-teal-300 hover:bg-teal-50/60'
                      }`}
                    >
                      <span className="tabular-nums">{val}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>1 = น้อยที่สุด</span>
                {selected ? (
                  <span className="font-medium text-teal-700">
                    เลือก: {selected} ({SCORE_LABELS[selected]})
                  </span>
                ) : (
                  <span>5 = มากที่สุด</span>
                )}
              </div>
            </section>
          );
        })}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <label
            htmlFor="feedback-comment"
            className="block text-base font-semibold text-slate-900"
          >
            ข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)
          </label>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            สิ่งที่ประทับใจ หรือสิ่งที่อยากให้ปรับปรุงในการอบรมครั้งถัดไป
          </p>
          <textarea
            id="feedback-comment"
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="พิมพ์ข้อเสนอแนะของคุณที่นี่..."
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </section>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          <Send className="h-5 w-5" />
          <span>{submitting ? 'กำลังส่งข้อมูล...' : 'ส่งแบบประเมิน'}</span>
        </button>
      </form>
    </main>
  );
}
