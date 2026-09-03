import { useState, type FormEvent } from 'react'
import type { Assignment, Score } from '../api'

type Props = { assignment: Assignment; score: Score; onReview: () => void; onOverview: () => void; onAppeal: (message: string) => Promise<void> }

export function ScorePreview({ assignment, score, onReview, onOverview, onAppeal }: Props) {
  const [appealState, setAppealState] = useState('')
  const [appealBusy, setAppealBusy] = useState(false)

  const submitAppeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const message = String(new FormData(form).get('message') || '')
    setAppealBusy(true); setAppealState('')
    void onAppeal(message)
      .then(() => { setAppealState('ส่งคำร้องแล้ว ผู้สอนจะตรวจสอบภายในช่วงอุทธรณ์'); form.reset() })
      .catch((reason) => setAppealState(reason instanceof Error ? reason.message : 'ส่งคำร้องไม่สำเร็จ'))
      .finally(() => setAppealBusy(false))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-10"><div className="flex flex-wrap items-start justify-between gap-6"><div><span className="inline-flex rounded-full bg-amber-300/15 px-3 py-1 text-xs font-semibold text-amber-200">{score.label}</span><h1 className="font-display mt-5 text-3xl font-semibold sm:text-4xl">{score.state === 'FINAL' ? 'ประกาศคะแนนสิ้นสุดแล้ว' : score.state === 'INTERIM' ? 'ส่งการประเมินแล้ว' : 'คะแนนยังไม่พร้อม'}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{score.state === 'FINAL' ? 'คะแนนนี้ถูกบันทึกเป็น snapshot พร้อมสูตรและข้อมูลนำเข้า เพื่อให้ตรวจสอบย้อนหลังได้' : 'คะแนนนี้คำนวณจาก submission จริงในฐานข้อมูล และยังเป็นผลชั่วคราวที่อาจารย์มีสิทธิ์ตรวจสอบ'}</p></div><div className="min-w-48 rounded-2xl border border-white/10 bg-white/[0.07] p-5 text-right"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">{score.state === 'FINAL' ? 'Final score' : 'Interim score'}</p><p className="font-display mt-2 text-4xl font-semibold text-indigo-300">{score.total === null ? '—' : score.total.toFixed(2)}</p><p className="mt-1 text-sm text-slate-400">จาก {assignment.groupMaxScore + assignment.individualMaxScore} คะแนน</p></div></div></section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">คุณภาพกลุ่ม</p><p className="font-display mt-3 text-3xl font-semibold">{score.groupComponent === null ? '—' : score.groupComponent.toFixed(2)}</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">ผลงานรายบุคคล</p><p className="font-display mt-3 text-3xl font-semibold">{score.individualComponent === null ? '—' : score.individualComponent.toFixed(2)}</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">สถานะข้อมูล</p><p className="font-display mt-3 text-2xl font-semibold">{score.flags.length ? 'Low confidence' : 'พร้อมคำนวณ'}</p><p className="mt-1 text-sm text-slate-500">ต้องมีผู้ประเมินอย่างน้อย {assignment.minComparisons} คน</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Participation</p><p className="font-display mt-3 text-3xl font-semibold">{Math.round(score.participationRatio * 100)}%</p><p className="mt-1 text-sm text-slate-500">Multiplier {score.participationMultiplier.toFixed(2)}</p></article></section>
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Privacy by design</p><h2 className="font-display mt-2 text-xl font-semibold text-indigo-950">ไม่มีข้อมูลผู้ประเมินรายคนในผลลัพธ์</h2><p className="mt-2 text-sm leading-6 text-indigo-900/75">API ส่งเฉพาะคะแนนรวม participation และจำนวน comparison ไม่ส่ง evaluator identity</p></section>
      {score.state === 'FINAL' && <form onSubmit={submitAppeal} className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-display text-xl font-semibold text-amber-950">ขอทบทวนคะแนน</h2><p className="mt-2 text-sm text-amber-900/75">ส่งได้ภายใน 7 วันหลังประกาศคะแนนสิ้นสุด</p><textarea required minLength={10} maxLength={4000} name="message" aria-label="เหตุผลขอทบทวนคะแนน" className="mt-4 min-h-24 w-full rounded-xl border border-amber-300 bg-white p-3 text-sm" placeholder="อธิบายจุดที่ต้องการให้ผู้สอนตรวจสอบ" /><button disabled={appealBusy} className="mt-3 min-h-11 rounded-xl bg-amber-900 px-5 text-sm font-semibold text-white">{appealBusy ? 'กำลังส่ง…' : 'ส่งคำร้อง'}</button>{appealState && <p role="status" className="mt-3 text-sm text-amber-900">{appealState}</p>}</form>}
      <div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onReview} className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold">ทบทวนคำตอบ</button><button type="button" onClick={onOverview} className="min-h-12 flex-1 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">กลับหน้าภาพรวม</button></div>
    </div>
  )
}
