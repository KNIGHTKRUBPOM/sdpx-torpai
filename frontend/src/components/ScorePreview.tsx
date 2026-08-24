type Props = { answered: number; total: number; onReview: () => void; onOverview: () => void }

export function ScorePreview({ answered, total, onReview, onOverview }: Props) {
  const participation = answered / total
  const multiplier = Math.min(1, participation / 0.9)
  const score = 16.928 * multiplier

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div><span className="inline-flex rounded-full bg-amber-300/15 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-200/20">ชั่วคราว — อาจเปลี่ยนแปลงได้</span><h1 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">ส่งการประเมินแล้ว</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">ระบบใช้ submission ล่าสุดของคุณ คะแนนนี้เป็น preview เพื่ออธิบายสูตรเท่านั้น อาจารย์ยังเป็นผู้ review และ finalize ผล</p></div>
          <div className="min-w-48 rounded-2xl border border-white/10 bg-white/[0.07] p-5 text-right"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Interim score</p><p className="font-display mt-2 text-4xl font-semibold text-indigo-300">{score.toFixed(2)}</p><p className="mt-1 text-sm text-slate-400">จาก 20 คะแนน</p></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">คุณภาพกลุ่ม</p><p className="font-display mt-3 text-3xl font-semibold text-slate-950">12.80</p><p className="mt-1 text-sm text-slate-500">จาก 15 · ไม่ถูกลดเพราะสมาชิกคนอื่น</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">รายบุคคล</p><p className="font-display mt-3 text-3xl font-semibold text-slate-950">4.13</p><p className="mt-1 text-sm text-slate-500">จาก 5 · band mapping 60–100%</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Participation</p><p className="font-display mt-3 text-3xl font-semibold text-slate-950">{Math.round(participation * 100)}%</p><p className="mt-1 text-sm text-slate-500">Multiplier {multiplier.toFixed(2)} · threshold 90%</p></article>
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Privacy by design</p><h2 className="font-display mt-2 text-xl font-semibold text-indigo-950">ผลลัพธ์นี้ไม่มีข้อมูลผู้ประเมินรายคน</h2><p className="mt-2 text-sm leading-6 text-indigo-900/75">นักศึกษาเห็นเฉพาะคะแนนรวมและ participation ของตัวเอง ไม่เห็นลำดับการส่ง กราฟเปลี่ยนแปลงรายวัน หรือข้อมูลที่ใช้อนุมานว่าใครให้คำตอบใด</p></section>
      <div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onReview} className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">ทบทวนคำตอบ</button><button type="button" onClick={onOverview} className="min-h-12 flex-1 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">กลับหน้าภาพรวม</button></div>
    </div>
  )
}
