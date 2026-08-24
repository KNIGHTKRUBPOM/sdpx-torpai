import { useEffect, useMemo, useState } from 'react'
import { CHOICES, DEMO_PAIRS, type ChoiceValue } from '../domain/evaluation'

type Props = {
  answers: Record<string, ChoiceValue>
  onAnswer: (pairId: string, choice: ChoiceValue) => void
  onBack: () => void
  onSubmit: () => void
}

export function EvaluationWorkspace({ answers, onAnswer, onBack, onSubmit }: Props) {
  const [saveState, setSaveState] = useState('ยังไม่มีการเปลี่ยนแปลง')
  const [confirmIncomplete, setConfirmIncomplete] = useState(false)
  const answered = Object.keys(answers).length
  const unanswered = DEMO_PAIRS.length - answered
  const progress = useMemo(() => (answered / DEMO_PAIRS.length) * 100, [answered])

  useEffect(() => {
    if (answered === 0) return
    setSaveState('กำลังบันทึก draft…')
    const timer = window.setTimeout(() => {
      const time = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' }).format(new Date())
      setSaveState(`บันทึกแล้ว เมื่อ ${time}`)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [answers, answered])

  const requestSubmit = () => {
    if (unanswered > 0) {
      setConfirmIncomplete(true)
      return
    }
    onSubmit()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="sticky top-3 z-20 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-lg shadow-slate-900/5 backdrop-blur sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} aria-label="กลับไปหน้าภาพรวม" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-lg text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">←</button>
            <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">Group evaluation</p><h1 className="font-display text-xl font-semibold text-slate-950">User Experience</h1></div>
          </div>
          <div className="text-right"><p className="font-display text-lg font-semibold text-slate-950" data-testid="evaluation-progress">{answered} / {DEMO_PAIRS.length}</p><p aria-live="polite" className="text-xs text-emerald-700">{saveState}</p></div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
      </section>

      <div className="space-y-5">
        {DEMO_PAIRS.map((pair, index) => (
          <fieldset key={pair.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <legend className="sr-only">คู่ที่ {index + 1}: {pair.prompt}</legend>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">คู่ที่ {index + 1}</p><p className="mt-1 text-sm font-medium leading-6 text-slate-700">{pair.prompt}</p></div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${answers[pair.id] ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{answers[pair.id] ? 'ตอบแล้ว' : 'รอคำตอบ'}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[pair.left, pair.right].map((item, sideIndex) => (
                <article key={item.name} className={`relative overflow-hidden rounded-2xl border p-5 ${sideIndex === 0 ? 'border-indigo-200 bg-indigo-50/70' : 'border-cyan-200 bg-cyan-50/70'}`}>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{sideIndex === 0 ? 'Left' : 'Right'}</span>
                  <h2 className="font-display mt-3 text-2xl font-semibold text-slate-950">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                  <a href={item.artifactUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:ring-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">ดูผลงาน <span aria-hidden="true">↗</span></a>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label={`คำตอบสำหรับคู่ที่ ${index + 1}`}>
              {CHOICES.map((choice) => {
                const selected = answers[pair.id] === choice.value
                return (
                  <label key={choice.value} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition focus-within:outline focus-within:outline-2 focus-within:outline-indigo-600 ${selected ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'}`}>
                    <input type="radio" name={pair.id} value={choice.value} checked={selected} onChange={() => onAnswer(pair.id, choice.value)} className="h-6 w-6 accent-indigo-600" />
                    <span><strong className="mr-1">{choice.value}</strong> {choice.label}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {confirmIncomplete && (
        <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <p className="font-semibold">ยังไม่ได้ตอบ {unanswered} คู่</p><p className="mt-1 text-sm">ส่งเฉพาะคำตอบปัจจุบันได้ ระบบจะนับคู่ที่ไม่ตอบไว้ใน participation ของคุณ</p>
          <div className="mt-4 flex gap-2"><button type="button" onClick={() => setConfirmIncomplete(false)} className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold">กลับไปตอบ</button><button type="button" onClick={onSubmit} className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white">ยืนยันส่งเท่าที่ตอบ</button></div>
        </section>
      )}

      <section className="flex flex-col-reverse items-stretch justify-between gap-3 rounded-2xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center">
        <div><p className="text-sm font-semibold">ส่งซ้ำได้ก่อน deadline</p><p className="mt-1 text-xs text-slate-400">การคำนวณจะใช้ submission ล่าสุด และเก็บ revision ไว้ตรวจสอบ</p></div>
        <button type="button" onClick={requestSubmit} data-testid="submit-evaluation" className="min-h-12 rounded-xl bg-indigo-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">ส่งการประเมิน</button>
      </section>
    </div>
  )
}
