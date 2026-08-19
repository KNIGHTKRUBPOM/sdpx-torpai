import { useState } from 'react'
import { AssignmentOverview } from './components/AssignmentOverview'
import { EvaluationWorkspace } from './components/EvaluationWorkspace'
import { ScorePreview } from './components/ScorePreview'
import { type ChoiceValue, type View } from './domain/evaluation'

export function App() {
  const [view, setView] = useState<View>('overview')
  const [answers, setAnswers] = useState<Record<string, ChoiceValue>>({})

  const navigate = (nextView: View) => {
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate('overview')} className="flex items-center gap-3 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-950/15">P/</span>
            <span><span className="font-display block text-lg font-semibold leading-5 tracking-tight">PairEval</span><span className="text-[11px] font-medium text-slate-400">Compare with clarity</span></span>
          </button>

          <nav aria-label="เมนูหลัก" data-testid="main-nav" className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 sm:flex">
            <button type="button" onClick={() => navigate('overview')} aria-current={view === 'overview' ? 'page' : undefined} className={`rounded-lg px-4 py-2 text-sm font-medium ${view === 'overview' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>ภาพรวม</button>
            <button type="button" onClick={() => navigate('evaluate')} aria-current={view === 'evaluate' ? 'page' : undefined} className={`rounded-lg px-4 py-2 text-sm font-medium ${view === 'evaluate' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>ประเมิน</button>
            <button type="button" onClick={() => navigate('results')} aria-current={view === 'results' ? 'page' : undefined} className={`rounded-lg px-4 py-2 text-sm font-medium ${view === 'results' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>ผลของฉัน</button>
          </nav>

          <div className="flex items-center gap-3"><div className="hidden text-right md:block"><p className="text-sm font-semibold text-slate-800">นก · Aurora</p><p className="text-xs text-slate-400">Student evaluator</p></div><span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 ring-4 ring-white">NK</span></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {view === 'overview' && <AssignmentOverview onStart={() => navigate('evaluate')} />}
        {view === 'evaluate' && <EvaluationWorkspace answers={answers} onAnswer={(pairId, choice) => setAnswers((current) => ({ ...current, [pairId]: choice }))} onBack={() => navigate('overview')} onSubmit={() => navigate('results')} />}
        {view === 'results' && <ScorePreview answered={Object.keys(answers).length} total={3} onReview={() => navigate('evaluate')} onOverview={() => navigate('overview')} />}
      </main>

      <footer className="mx-auto mt-8 max-w-7xl border-t border-slate-200 px-4 py-8 text-xs text-slate-400 sm:px-6 lg:px-8">PairEval WS-03 prototype · สูตรโปร่งใส · การตัดสินสุดท้ายเป็นของอาจารย์</footer>
    </div>
  )
}

export default App
