type AssignmentOverviewProps = { onStart: () => void }

const Metric = ({ value, label, tone }: { value: string; label: string; tone: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
    <div className={`mb-3 h-1.5 w-12 rounded-full ${tone}`} />
    <p className="font-display text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    <p className="mt-1 text-sm text-slate-500">{label}</p>
  </div>
)

export function AssignmentOverview({ onStart }: AssignmentOverviewProps) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-indigo-950/15 sm:px-10 sm:py-11">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> เปิดรับการประเมิน · Sprint 1
            </div>
            <p className="text-sm font-medium text-indigo-200">CSX 301 · Software Studio</p>
            <h1 className="font-display mt-2 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">
              เปรียบเทียบให้ชัด <span className="block text-indigo-300">ตัดสินด้วยหลักฐาน</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              คุณมี 3 คู่ในเกณฑ์ User Experience ใช้เวลาประมาณ 4 นาที ระบบบันทึกคำตอบเป็น draft และใช้เฉพาะคำตอบที่กดส่งแล้วในการคำนวณ
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
            <div className="flex items-center justify-between text-sm"><span className="text-slate-300">เวลาที่เหลือ</span><span className="font-semibold text-amber-300">2 วัน 08 ชม.</span></div>
            <div className="my-4 h-px bg-white/10" />
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Progress</p><p className="font-display mt-1 text-2xl font-semibold">0 / 3 คู่</p></div>
              <button type="button" onClick={onStart} data-testid="main-cta" className="rounded-xl bg-indigo-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">เริ่มประเมิน</button>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="overview-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Assignment pulse</p><h2 id="overview-heading" className="font-display mt-1 text-2xl font-semibold text-slate-950">ภาพรวมก่อนเริ่ม</h2></div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">Autosave พร้อมใช้งาน</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric value="92%" label="การมีส่วนร่วมทั้งห้อง" tone="bg-emerald-500" />
          <Metric value="4×" label="coverage จริงต่อคู่" tone="bg-indigo-500" />
          <Metric value="1" label="คู่ต่อคน / เกณฑ์" tone="bg-cyan-500" />
          <Metric value="6" label="forced choices ไม่มีค่ากลาง" tone="bg-amber-500" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">เกณฑ์ที่กำลังทำ</p><h2 className="font-display mt-2 text-xl font-semibold text-slate-950">User Experience · 40%</h2></div><span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">GROUP</span></div>
          <p className="mt-4 text-sm leading-6 text-slate-600">พิจารณาความชัดเจนของ flow, feedback หลังการกระทำ และประสบการณ์บนหน้าจอขนาดเล็ก เปิดผลงานทั้งสองฝั่งก่อนเลือกคำตอบ</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-600"><span className="rounded-lg bg-slate-100 px-3 py-2">Completeness 35%</span><span className="rounded-lg bg-slate-100 px-3 py-2">Innovation 25%</span></div>
        </article>
        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Feasibility note</p><h2 className="font-display mt-2 text-lg font-semibold text-amber-950">coverage ลดจาก 5× เหลือ 4×</h2>
          <p className="mt-3 text-sm leading-6 text-amber-900/75">ห้องตัวอย่างมี 3 กลุ่ม คู่ที่จำกัดที่สุดมีผู้ประเมินที่มีสิทธิ์ 4 คน จึงลดอย่างโปร่งใสและยังคง workload ที่ 1 คู่ต่อเกณฑ์</p>
        </aside>
      </section>
    </div>
  )
}
