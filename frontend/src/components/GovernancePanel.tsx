import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, type Assignment } from '../api'

type GroupRow = { itemId: string; itemName: string; component: number | null; flags: string[] }
type QualityFlag = { signal: string; action: string; rater?: string; pairIds?: string[]; value?: number; valueMs?: number }
type Appeal = { id: string; studentName: string; message: string; status: string; resolution: string | null; createdAt: string }
type AuditEvent = { id: string; actor: string; action: string; resourceType: string; resourceId: string; reason: string | null; occurredAt: string }

type Props = {
  assignment: Assignment
  userId: string
  canFinalize: boolean
  onClose: () => void
  onChanged: () => void
}

function readableSignal(signal: string): string {
  return ({
    LOW_COVERAGE: 'Coverage ต่ำ',
    STRAIGHT_LINING: 'ตอบรูปแบบเดิมซ้ำ',
    POSITION_BIAS: 'เลือกตามตำแหน่ง',
    SPEED_RUN: 'ตอบเร็วผิดปกติ',
    INTRANSITIVITY: 'คำตอบไม่สอดคล้องกัน',
    SELF_GROUP_FAVORITISM: 'อาจเอนเอียงเข้ากลุ่มตนเอง',
    LOW_AGREEMENT: 'ความเห็นผู้ประเมินสอดคล้องกันต่ำ',
  } as Record<string, string>)[signal] || signal
}

export function GovernancePanel({ assignment, userId, canFinalize: canFinalizeByRole, onClose, onChanged }: Props) {
  const [groupRows, setGroupRows] = useState<GroupRow[]>([])
  const [quality, setQuality] = useState<QualityFlag[]>([])
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [values, setValues] = useState<Record<string, string>>({})
  const [status, setStatus] = useState(assignment.status)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const [group, qualityResult, appealResult, auditResult] = await Promise.all([
      api<{ rows: GroupRow[] }>(`/api/assignments/${assignment.id}/reports/group`, {}, userId),
      api<{ flags: QualityFlag[] }>(`/api/assignments/${assignment.id}/reports/quality`, {}, userId),
      api<Appeal[]>(`/api/assignments/${assignment.id}/appeals`, {}, userId),
      api<AuditEvent[]>(`/api/assignments/${assignment.id}/audit`, {}, userId),
    ])
    setGroupRows(group.rows); setQuality(qualityResult.flags); setAppeals(appealResult); setEvents(auditResult)
  }, [assignment.id, userId])

  useEffect(() => { void load().catch((reason) => setError(reason instanceof Error ? reason.message : 'โหลดข้อมูลกำกับดูแลไม่สำเร็จ')) }, [load])

  const run = async (work: () => Promise<void>) => {
    setBusy(true); setError(''); setNotice('')
    try { await work(); await load(); onChanged() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'ทำรายการไม่สำเร็จ') }
    finally { setBusy(false) }
  }

  const overrideScore = (event: FormEvent<HTMLFormElement>, row: GroupRow) => {
    event.preventDefault()
    void run(async () => {
      await api(`/api/assignments/${assignment.id}/overrides`, {
        method: 'POST',
        body: JSON.stringify({ side: 'GROUP', itemId: row.itemId, overrideValue: Number(values[row.itemId]), reason: reasons[row.itemId] }),
      }, userId)
      setNotice(`ปรับคะแนน ${row.itemName} แล้ว และบันทึกเหตุผลใน audit`)
    })
  }

  const excludeComparison = (flag: QualityFlag) => void run(async () => {
    const pairId = flag.pairIds?.[0]
    if (!pairId) throw new Error('สัญญาณนี้ไม่มี comparison ที่ตัดออกได้')
    await api(`/api/comparisons/${pairId}:exclude`, {
      method: 'POST', body: JSON.stringify({ reason: reasons[`quality-${pairId}`] }),
    }, userId)
    setNotice('ตัด comparison ออกจากการคำนวณแล้ว สัญญาณคุณภาพไม่มีผลต่อคะแนนโดยอัตโนมัติ')
  })

  const resolveAppeal = (appeal: Appeal, nextStatus: 'RESOLVED' | 'REJECTED') => void run(async () => {
    await api(`/api/appeals/${appeal.id}:resolve`, {
      method: 'POST', body: JSON.stringify({ status: nextStatus, resolution: reasons[`appeal-${appeal.id}`] }),
    }, userId)
    setNotice('บันทึกผลการพิจารณาคำร้องแล้ว')
  })

  const finalize = () => void run(async () => {
    const result = await api<{ status: Assignment['status'] }>(`/api/assignments/${assignment.id}:finalize`, {
      method: 'POST', body: JSON.stringify({ reason: reasons.finalize || null }),
    }, userId)
    setStatus(result.status); setNotice('สร้าง score snapshot และประกาศคะแนนสิ้นสุดแล้ว')
  })

  const reopen = () => void run(async () => {
    const result = await api<{ status: Assignment['status'] }>(`/api/assignments/${assignment.id}:reopen`, {
      method: 'POST', body: JSON.stringify({ reason: reasons.reopen }),
    }, userId)
    setStatus(result.status); setNotice('เปิดงานกลับมาเพื่อตรวจแก้แล้ว การ finalize ครั้งถัดไปจะสร้าง snapshot revision ใหม่')
  })

  const latestDeadline = Math.max(new Date(assignment.deadline).getTime(), new Date(assignment.individualDeadline || assignment.deadline).getTime())
  const canFinalize = canFinalizeByRole && status !== 'FINALIZED' && latestDeadline <= Date.now()

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">M3 Governance</p><h2 className="font-display mt-2 text-2xl font-semibold">{assignment.name}</h2><p className="mt-1 text-sm text-slate-500">สัญญาณเป็นเพียงคำเตือน จะไม่ลดน้ำหนักคะแนนอัตโนมัติ</p></div><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">ปิด</button></div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div><h3 className="font-semibold">ตรวจและปรับคะแนนกลุ่ม</h3><div className="mt-3 space-y-3">{groupRows.map((row) => <form key={row.itemId} onSubmit={(event) => overrideScore(event, row)} className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between gap-3 text-sm"><strong>{row.itemName}</strong><span>{row.component?.toFixed(2) ?? '—'}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr_auto]"><input required type="number" min="0" max={assignment.groupMaxScore} step="0.01" value={values[row.itemId] || ''} onChange={(event) => setValues((current) => ({ ...current, [row.itemId]: event.target.value }))} aria-label={`คะแนนใหม่ ${row.itemName}`} placeholder="คะแนน" className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm" /><input required minLength={5} value={reasons[row.itemId] || ''} onChange={(event) => setReasons((current) => ({ ...current, [row.itemId]: event.target.value }))} aria-label={`เหตุผลปรับคะแนน ${row.itemName}`} placeholder="เหตุผลที่ตรวจสอบได้" className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm" /><button disabled={busy} className="rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white">Override</button></div></form>)}</div></div>

        <div><h3 className="font-semibold">สัญญาณคุณภาพ ({quality.length})</h3><div className="mt-3 max-h-[28rem] space-y-3 overflow-auto">{quality.length === 0 && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">ยังไม่พบสัญญาณที่เกิน threshold</p>}{quality.map((flag, index) => { const pairId = flag.pairIds?.[0]; return <div key={`${flag.signal}-${flag.rater || index}`} className="rounded-xl bg-amber-50 p-4 text-sm"><div className="flex justify-between gap-3"><strong>{readableSignal(flag.signal)}</strong><span className="text-xs text-amber-800">{flag.rater || 'ระดับคู่ประเมิน'}</span></div><p className="mt-1 text-xs text-amber-900/70">แนวทาง: {flag.action}</p>{pairId && <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"><input minLength={5} value={reasons[`quality-${pairId}`] || ''} onChange={(event) => setReasons((current) => ({ ...current, [`quality-${pairId}`]: event.target.value }))} aria-label={`เหตุผลตัด comparison ${pairId}`} placeholder="เหตุผลหลังตรวจด้วยตา" className="min-h-10 rounded-lg border border-amber-300 bg-white px-3 text-xs" /><button type="button" disabled={busy || (reasons[`quality-${pairId}`] || '').length < 5} onClick={() => excludeComparison(flag)} className="rounded-lg border border-amber-700 px-3 text-xs font-semibold text-amber-900">ตัด comparison แรก</button></div>}</div>})}</div></div>

        <div><h3 className="font-semibold">คำร้องขอทบทวน ({appeals.filter((appeal) => appeal.status === 'OPEN').length} เปิดอยู่)</h3><div className="mt-3 space-y-3">{appeals.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">ยังไม่มีคำร้อง</p>}{appeals.map((appeal) => <div key={appeal.id} className="rounded-xl bg-slate-50 p-4 text-sm"><div className="flex justify-between gap-3"><strong>{appeal.studentName}</strong><span>{appeal.status}</span></div><p className="mt-2 text-slate-600">{appeal.message}</p>{appeal.status === 'OPEN' && <><input minLength={5} value={reasons[`appeal-${appeal.id}`] || ''} onChange={(event) => setReasons((current) => ({ ...current, [`appeal-${appeal.id}`]: event.target.value }))} aria-label={`ผลพิจารณาคำร้อง ${appeal.studentName}`} placeholder="ผลการตรวจสอบ" className="mt-3 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /><div className="mt-2 flex gap-2"><button type="button" disabled={busy || (reasons[`appeal-${appeal.id}`] || '').length < 5} onClick={() => resolveAppeal(appeal, 'RESOLVED')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">รับและแก้ไข</button><button type="button" disabled={busy || (reasons[`appeal-${appeal.id}`] || '').length < 5} onClick={() => resolveAppeal(appeal, 'REJECTED')} className="rounded-lg border border-slate-400 px-3 py-2 text-xs font-semibold">ยืนยันคะแนนเดิม</button></div></>}</div>)}</div></div>

        <div><h3 className="font-semibold">Audit trail</h3><div className="mt-3 max-h-80 space-y-2 overflow-auto">{events.map((event) => <div key={event.id} className="rounded-xl border border-slate-200 p-3 text-xs"><div className="flex justify-between gap-3"><strong>{event.action}</strong><time>{new Date(event.occurredAt).toLocaleString('th-TH')}</time></div><p className="mt-1 text-slate-500">{event.actor} · {event.resourceType} · {event.reason || 'ไม่มีเหตุผลเพิ่มเติม'}</p></div>)}</div></div>
      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5"><h3 className="font-semibold text-violet-950">สถานะคะแนน: {status}</h3>{status === 'FINALIZED' ? <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"><input required minLength={5} value={reasons.reopen || ''} onChange={(event) => setReasons((current) => ({ ...current, reopen: event.target.value }))} aria-label="เหตุผลเปิดคะแนนใหม่" placeholder="เหตุผลที่ต้อง reopen" className="min-h-11 rounded-xl border border-violet-300 bg-white px-3 text-sm" /><button type="button" disabled={busy || !canFinalizeByRole || (reasons.reopen || '').length < 5} onClick={reopen} className="rounded-xl bg-violet-900 px-5 text-sm font-semibold text-white disabled:opacity-40">Reopen</button></div> : <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"><input value={reasons.finalize || ''} onChange={(event) => setReasons((current) => ({ ...current, finalize: event.target.value }))} aria-label="หมายเหตุประกาศคะแนน" placeholder="หมายเหตุการ finalize (ถ้ามี)" className="min-h-11 rounded-xl border border-violet-300 bg-white px-3 text-sm" /><button type="button" disabled={busy || !canFinalize} onClick={finalize} className="rounded-xl bg-violet-900 px-5 text-sm font-semibold text-white disabled:opacity-40">Finalize และสร้าง snapshot</button></div>}{!canFinalizeByRole ? <p className="mt-2 text-xs text-violet-800">เฉพาะ Owner เท่านั้นที่ Finalize หรือ Reopen คะแนนได้</p> : !canFinalize && status !== 'FINALIZED' && <p className="mt-2 text-xs text-violet-800">ปุ่มจะเปิดหลัง deadline ทั้งสองส่วนผ่านแล้ว</p>}</div>
    </section>
  )
}
