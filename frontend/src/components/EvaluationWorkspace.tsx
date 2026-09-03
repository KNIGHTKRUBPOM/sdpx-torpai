import { useEffect, useMemo, useRef, useState } from 'react'
import { CHOICES, type ChoiceValue, type EvaluationBundle } from '../api'

type Props = {
  bundle: EvaluationBundle
  answers: Record<string, ChoiceValue>
  saveState: string
  saving: boolean
  submitting: boolean
  onAnswer: (pairId: string, choice: ChoiceValue, timeOnTaskMs: number) => void
  onBack: () => void
  onSubmit: () => void
}

export function EvaluationWorkspace({ bundle, answers, saveState, saving, submitting, onAnswer, onBack, onSubmit }: Props) {
  const [confirmIncomplete, setConfirmIncomplete] = useState(false)
  const lastInteractionAt = useRef(Date.now())
  const answered = Object.keys(answers).length
  const unanswered = bundle.pairs.length - answered
  const progress = useMemo(() => bundle.pairs.length ? (answered / bundle.pairs.length) * 100 : 0, [answered, bundle.pairs.length])
  const criterion = bundle.pairs[0]?.criterion || bundle.assignment.criteria.find((item) => item.side === bundle.side)?.name || (bundle.side === 'GROUP' ? 'Group Evaluation' : 'Individual Evaluation')

  useEffect(() => { lastInteractionAt.current = Date.now() }, [bundle.assignment.id, bundle.side])

  const answer = (pairId: string, choice: ChoiceValue) => {
    const now = Date.now()
    const elapsed = Math.max(1, now - lastInteractionAt.current)
    lastInteractionAt.current = now
    onAnswer(pairId, choice, elapsed)
  }

  const requestSubmit = () => {
    if (unanswered > 0) return setConfirmIncomplete(true)
    onSubmit()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="sticky top-3 z-20 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-lg shadow-slate-900/5 backdrop-blur sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><button type="button" onClick={onBack} aria-label="กลับไปหน้าภาพรวม" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-lg">←</button><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">{bundle.assignment.name}</p><h1 className="font-display text-xl font-semibold">{criterion}</h1></div></div>
          <div className="text-right"><p className="font-display text-lg font-semibold" data-testid="evaluation-progress">{answered} / {bundle.pairs.length}</p><p aria-live="polite" className="text-xs text-emerald-700">{saveState}</p></div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-[width]" style={{ width: `${progress}%` }} /></div>
      </section>

      {bundle.readOnly && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">พ้นกำหนดส่งแล้ว คำตอบอยู่ในโหมดอ่านอย่างเดียว</p>}
      {bundle.disabledReason && <p role="status" className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-700">{bundle.disabledReason}</p>}
      <div className="space-y-5">
        {bundle.pairs.map((pair, index) => (
          <fieldset key={pair.id} disabled={bundle.readOnly} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <legend className="sr-only">คู่ที่ {index + 1}: {pair.prompt}</legend>
            <div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">คู่ที่ {index + 1}</p><p className="mt-1 text-sm font-medium leading-6 text-slate-700">{pair.prompt}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${answers[pair.id] ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{answers[pair.id] ? 'ตอบแล้ว' : 'รอคำตอบ'}</span></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[pair.left, pair.right].map((item, sideIndex) => <article key={item.id} className={`rounded-2xl border p-5 ${sideIndex === 0 ? 'border-indigo-200 bg-indigo-50/70' : 'border-cyan-200 bg-cyan-50/70'}`}><span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{sideIndex === 0 ? 'Left' : 'Right'}</span><h2 className="font-display mt-3 text-2xl font-semibold">{item.name}</h2>{item.artifactUrl ? <a href={item.artifactUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-200">ดูผลงาน ↗</a> : bundle.side === 'GROUP' ? <p className="mt-4 text-sm text-amber-700">อาจารย์ยังไม่ได้ระบุผลงาน</p> : <p className="mt-4 text-sm text-slate-500">สมาชิกภายในกลุ่มเดียวกัน</p>}</article>)}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label={`คำตอบสำหรับคู่ที่ ${index + 1}`}>
              {CHOICES.map((choice) => {
                const selected = answers[pair.id] === choice.value
                return <label key={choice.value} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}><input type="radio" name={pair.id} value={choice.value} checked={selected} onChange={() => answer(pair.id, choice.value)} className="h-6 w-6 accent-indigo-600" /><span><strong className="mr-1">{choice.value}</strong> {choice.label}</span></label>
              })}
            </div>
          </fieldset>
        ))}
      </div>
      {confirmIncomplete && <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"><p className="font-semibold">ยังไม่ได้ตอบ {unanswered} คู่</p><p className="mt-1 text-sm">ส่งเฉพาะคำตอบปัจจุบันได้ คู่ที่ไม่ตอบจะกระทบ participation</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => setConfirmIncomplete(false)} className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold">กลับไปตอบ</button><button type="button" onClick={onSubmit} className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white">ยืนยันส่งเท่าที่ตอบ</button></div></section>}
      <section className="flex flex-col-reverse items-stretch justify-between gap-3 rounded-2xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center"><div><p className="text-sm font-semibold">ส่งซ้ำได้ก่อน deadline</p><p className="mt-1 text-xs text-slate-400">ระบบเก็บ revision และคำนวณจาก submission ล่าสุด</p></div><button disabled={saving || submitting || bundle.readOnly} type="button" onClick={requestSubmit} data-testid="submit-evaluation" className="min-h-12 rounded-xl bg-indigo-400 px-6 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? 'รอบันทึกคำตอบ…' : submitting ? 'กำลังส่ง…' : 'ส่งการประเมิน'}</button></section>
    </div>
  )
}
