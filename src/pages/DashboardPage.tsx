import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, MessageSquare, Users } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  interpretAverageScore,
  SURVEY_QUESTIONS,
  SurveyResponseRecord,
} from '../surveyConfig';

export default function DashboardPage() {
  const [responses, setResponses] = useState<SurveyResponseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const surveyUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', 'survey');
    return url.toString();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'responses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SurveyResponseRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const ts = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
          return {
            id: docSnap.id,
            q1: Number(data.q1) || 0,
            q2: Number(data.q2) || 0,
            q3: Number(data.q3) || 0,
            q4: Number(data.q4) || 0,
            q5: Number(data.q5) || 0,
            comment: typeof data.comment === 'string' ? data.comment : undefined,
            deviceToken: String(data.deviceToken || ''),
            createdAtMs: ts,
          };
        });
        setResponses(list);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'responses');
      }
    );

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = responses.length;
    if (total === 0) {
      return {
        total: 0,
        overallAvg: 0,
        perQuestion: SURVEY_QUESTIONS.map((q) => ({ ...q, avg: 0 })),
        comments: [] as SurveyResponseRecord[],
      };
    }

    const perQuestion = SURVEY_QUESTIONS.map((q) => {
      const sum = responses.reduce((acc, r) => acc + r[q.key], 0);
      return { ...q, avg: sum / total };
    });

    const overallAvg =
      perQuestion.reduce((acc, item) => acc + item.avg, 0) / perQuestion.length;

    const comments = responses.filter((r) => r.comment && r.comment.trim().length > 0);

    return { total, overallAvg, perQuestion, comments };
  }, [responses]);

  const interpretation = interpretAverageScore(stats.overallAvg);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadCsv = () => {
    const headers = [
      'ลำดับ',
      'เวลาที่ส่ง',
      'ข้อ 1 เนื้อหา',
      'ข้อ 2 วิทยากร',
      'ข้อ 3 เอกสาร/สื่อ',
      'ข้อ 4 สถานที่/ระบบ',
      'ข้อ 5 ภาพรวม',
      'ค่าเฉลี่ยรายคน',
      'ข้อเสนอแนะ',
    ];

    const escapeCsv = (val: string | number) => {
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = responses.map((r, idx) => {
      const avg = ((r.q1 + r.q2 + r.q3 + r.q4 + r.q5) / 5).toFixed(2);
      const timeStr = new Date(r.createdAtMs).toLocaleString('th-TH');
      return [
        idx + 1,
        timeStr,
        r.q1,
        r.q2,
        r.q3,
        r.q4,
        r.q5,
        avg,
        r.comment || '',
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `training-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard สรุปผลความพึงพอใจ
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            อัปเดตผลคะแนนและข้อเสนอแนะแบบเรียลไทม์
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={responses.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>ดาวน์โหลด CSV</span>
        </button>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        <div className="rounded-2xl border border-orange-100 bg-white p-6">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            <span>จำนวนผู้ตอบทั้งหมด</span>
            <Users className="h-5 w-5 text-orange-500" />
          </div>
          <div className="mt-3 text-4xl font-bold text-orange-600 tabular-nums">
            {loading ? '—' : stats.total}
            <span className="ml-2 text-base font-normal text-slate-500">คน</span>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-6">
          <div className="text-sm font-medium text-slate-500">
            คะแนนเฉลี่ยรวม (เต็ม 5.00)
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-4xl font-bold text-orange-600 tabular-nums">
              {loading ? '—' : stats.overallAvg.toFixed(2)}
            </span>
            {stats.total > 0 && (
              <span className={`text-lg font-semibold ${interpretation.colorClass}`}>
                ระดับ{interpretation.level}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-6">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            <span>ข้อเสนอแนะที่ได้รับ</span>
            <MessageSquare className="h-5 w-5 text-orange-500" />
          </div>
          <div className="mt-3 text-4xl font-bold text-slate-900 tabular-nums">
            {loading ? '—' : stats.comments.length}
            <span className="ml-2 text-base font-normal text-slate-500">รายการ</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Bar Chart + QR Code */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bar Chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            คะแนนเฉลี่ยรายข้อ
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            เปรียบเทียบคะแนนเฉลี่ยแต่ละด้าน (เกณฑ์ 1.00 – 5.00)
          </p>

          <div className="mt-6 space-y-5">
            {stats.perQuestion.map((item) => {
              const pct = Math.min(100, Math.max(0, (item.avg / 5) * 100));
              const interp = interpretAverageScore(item.avg);
              return (
                <div key={item.key}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-4">
                    <span className="text-sm font-medium text-slate-800 sm:text-base">
                      {item.label}
                    </span>
                    <div className="flex items-baseline gap-2 shrink-0 tabular-nums">
                      <span className="text-base font-bold text-slate-900 sm:text-lg">
                        {stats.total > 0 ? item.avg.toFixed(2) : '0.00'}
                      </span>
                      {stats.total > 0 && (
                        <span className={`text-xs font-medium ${interp.colorClass}`}>
                          ({interp.level})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full bg-orange-50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* QR Code & Link */}
        <section className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              สแกนเพื่อทำแบบประเมิน
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              ผู้เข้าอบรมสามารถสแกน QR Code นี้ผ่านมือถือได้ทันที
            </p>
          </div>

          <div className="my-6 rounded-2xl border border-slate-200 bg-white p-4">
            <QRCodeSVG value={surveyUrl} size={184} level="M" />
          </div>

          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800 transition-colors hover:bg-orange-100"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">คัดลอกลิงก์แล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>คัดลอกลิงก์แบบสอบถาม</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Latest Comments */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          ข้อเสนอแนะล่าสุด
        </h2>

        {stats.comments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            ยังไม่มีข้อเสนอแนะเพิ่มเติมในขณะนี้
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {stats.comments.slice(0, 12).map((item) => (
              <li key={item.id} className="py-3.5 first:pt-0 last:pb-0">
                <p className="text-base text-slate-800">{item.comment}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                  <span>
                    คะแนนเฉลี่ย {((item.q1 + item.q2 + item.q3 + item.q4 + item.q5) / 5).toFixed(1)} / 5
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(item.createdAtMs).toLocaleTimeString('th-TH')}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
