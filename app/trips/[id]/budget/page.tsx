import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { addExpense, deleteExpense } from "../wallet/actions";
import { updateTripBudget } from "./actions";

type Expense = { id: string; amount: number; currency: string; category: string; note: string | null; paid_at: string; paid_by?: string | null; payment_method?: string | null; exchange_rate_thb?: number | null; planned_amount?: number | null };

const labels: Record<string, string> = { food: "อาหาร", restaurant: "ร้านอาหาร", transport: "เดินทาง", rental_car: "รถเช่า", fuel: "น้ำมัน", toll: "ทางด่วน", parking: "ที่จอดรถ", hotel: "โรงแรม", ticket: "ตั๋ว", shopping: "ช้อปปิ้ง", insurance: "ประกัน", other: "อื่น ๆ" };

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/budget`);
  const [{ data: trip }, { data: expenses }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title,budget,currency").eq("id", id).single(),
    supabase.from("expenses").select("id,amount,currency,category,note,paid_at,paid_by,payment_method,exchange_rate_thb,planned_amount").eq("trip_id", id).order("paid_at", { ascending: false }),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);
  if (!trip) notFound();
  const rows = (expenses || []) as Expense[];
  const canEdit = role === "owner" || role === "editor";
  const isOwner = role === "owner";
  const totals = rows.reduce<Record<string, number>>((acc, e) => { acc[e.currency] = (acc[e.currency] || 0) + Number(e.amount); return acc; }, {});
  const baseCurrency = trip.currency || "THB";
  const baseSpent = totals[baseCurrency] || 0;
  const budget = Number(trip.budget || 0);
  const percent = budget ? Math.min(100, Math.round((baseSpent / budget) * 100)) : 0;
  const categories = Object.entries(rows.filter((e) => e.currency === baseCurrency).reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] || 0) + Number(e.amount); return acc; }, {})).sort((a, b) => b[1] - a[1]);
  const thbEquivalent = rows.reduce((sum,e)=> sum + (e.currency === "THB" ? Number(e.amount) : e.exchange_rate_thb ? Number(e.amount) * Number(e.exchange_rate_thb) : 0), 0);
  const byPayer = Object.entries(rows.reduce<Record<string,number>>((acc,e)=>{const key=e.paid_by||"ไม่ระบุ";acc[key]=(acc[key]||0)+(e.currency==="THB"?Number(e.amount):e.exchange_rate_thb?Number(e.amount)*Number(e.exchange_rate_thb):0);return acc;},{})).sort((a,b)=>b[1]-a[1]);

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">V10.6 Expense & Split</span></div>
    <section className="planner-hero v8-budget-hero"><div><span className="eyebrow">BUDGET CONTROL</span><h1>💴 Actual Expense & Split Cost</h1><p>{trip.title} · บันทึกคนจ่าย วิธีจ่าย และเรทที่ใช้จริงโดยไม่ต้องพึ่ง API ค่าเงิน</p></div><Link className="btn btn-secondary" href={`/trips/${id}/bookings`}>Booking Center</Link></section>

    <section className="master-summary-grid"><div className="card dashboard-metric"><span>JPY ใช้จริง</span><strong>¥{(totals.JPY || 0).toLocaleString("th-TH")}</strong><small>ญี่ปุ่น</small></div><div className="card dashboard-metric"><span>THB ใช้จริง</span><strong>฿{(totals.THB || 0).toLocaleString("th-TH")}</strong><small>ก่อนเดินทาง/บัตร</small></div><div className="card dashboard-metric"><span>THB equivalent</span><strong>฿{thbEquivalent.toLocaleString("th-TH",{maximumFractionDigits:0})}</strong><small>เฉพาะรายการที่ใส่เรท</small></div><div className="card dashboard-metric"><span>Budget ({baseCurrency})</span><strong>{budget ? budget.toLocaleString("th-TH") : "—"}</strong><small>{budget ? `คงเหลือ ${Math.max(0, budget - baseSpent).toLocaleString("th-TH")}` : "ยังไม่ตั้งงบ"}</small></div></section>

    {budget > 0 && <section className="card budget-card"><div className="section-head"><strong>Budget usage · {baseCurrency}</strong><span>{percent}%</span></div><div className="progress-track"><span style={{ width: `${percent}%` }}/></div></section>}

    {isOwner && <details className="details-card"><summary>ตั้งงบหลัก</summary><form action={updateTripBudget} className="inline-form"><input type="hidden" name="trip_id" value={id}/><div className="grid2"><input className="input" type="number" name="budget" min="0" step="0.01" defaultValue={trip.budget || ""} placeholder="งบทั้งหมด"/><select className="select" name="currency" defaultValue={baseCurrency}><option value="THB">THB ฿</option><option value="JPY">JPY ¥</option></select></div><SubmitButton className="btn btn-primary" pendingText="กำลังบันทึก...">บันทึกงบ</SubmitButton></form></details>}

    <section className="section"><div className="section-head"><h2>ค่าใช้จ่ายตามหมวด ({baseCurrency})</h2><span className="small muted">เฉพาะสกุลเงินงบหลัก</span></div><div className="budget-category-list">{categories.length ? categories.map(([key, amount]) => <div className="budget-category-row" key={key}><div><strong>{labels[key] || key}</strong><small>{rows.filter((e) => e.currency === baseCurrency && e.category === key).length} รายการ</small></div><strong>{baseCurrency === "JPY" ? "¥" : "฿"}{amount.toLocaleString("th-TH")}</strong></div>) : <div className="empty-mini">ยังไม่มีค่าใช้จ่ายในสกุล {baseCurrency}</div>}</div></section>

    <section className="section"><div className="section-head"><h2>ใครเป็นคนจ่าย</h2><span className="small muted">THB equivalent</span></div>{byPayer.length?<div className="budget-category-list">{byPayer.map(([name,amount])=><div className="budget-category-row" key={name}><div><strong>{name}</strong><small>รวมรายการที่มี THB/เรทแปลง</small></div><strong>฿{amount.toLocaleString("th-TH",{maximumFractionDigits:0})}</strong></div>)}</div>:<div className="empty-mini">ยังไม่มีข้อมูลผู้จ่าย</div>}</section>

    <section className="section"><div className="section-head"><h2>รายการล่าสุด</h2><span className="small muted">{rows.length} รายการ</span></div>{rows.length ? <div className="expense-list">{rows.slice(0, 20).map((e) => <div className="expense-row" key={e.id}><div className="expense-icon">💴</div><div className="expense-copy"><strong>{e.note || labels[e.category] || e.category}</strong><small>{labels[e.category] || e.category} · {new Date(e.paid_at).toLocaleDateString("th-TH")}{e.paid_by ? ` · ${e.paid_by}` : ""}{e.payment_method ? ` · ${e.payment_method}` : ""}</small></div><strong className="expense-amount">{e.currency === "JPY" ? "¥" : "฿"}{Number(e.amount).toLocaleString("th-TH")}</strong>{canEdit && <form action={deleteExpense}><input type="hidden" name="trip_id" value={id}/><input type="hidden" name="expense_id" value={e.id}/><button className="icon-danger">×</button></form>}</div>)}</div> : <div className="empty-mini">ยังไม่มีค่าใช้จ่าย</div>}</section>

    {canEdit && <details className="add-activity-panel"><summary><span className="plus-circle">＋</span><span><strong>บันทึกค่าใช้จ่าย</strong><small>รวมรถเช่า น้ำมัน ทางด่วน และที่จอดรถ</small></span></summary><form action={addExpense} className="inline-form"><input type="hidden" name="trip_id" value={id}/><div className="grid2"><input className="input" name="amount" type="number" min="0.01" step="0.01" placeholder="จำนวนเงิน" required/><select className="select" name="currency" defaultValue="JPY"><option value="JPY">JPY ¥</option><option value="THB">THB ฿</option></select></div><div className="grid2"><select className="select" name="category" defaultValue="food"><option value="food">อาหาร</option><option value="restaurant">ร้านอาหาร</option><option value="transport">เดินทาง</option><option value="rental_car">รถเช่า</option><option value="fuel">น้ำมัน</option><option value="toll">ทางด่วน/ETC</option><option value="parking">ที่จอดรถ</option><option value="hotel">โรงแรม</option><option value="ticket">ตั๋ว</option><option value="shopping">ช้อปปิ้ง</option><option value="insurance">ประกัน</option><option value="other">อื่น ๆ</option></select><input className="input" name="paid_date" type="date"/></div><div className="grid2"><input className="input" name="paid_by" placeholder="ผู้จ่าย เช่น Dad / Mom"/><select className="select" name="payment_method" defaultValue="cash"><option value="cash">Cash</option><option value="credit_card">Credit card</option><option value="debit_card">Debit card</option><option value="ic_card">IC card</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></div><div className="grid2"><input className="input" type="number" min="0" step="0.000001" name="exchange_rate_thb" placeholder="เรท THB ต่อ 1 หน่วย (ถ้าต้องการ)"/><input className="input" type="number" min="0" step="0.01" name="planned_amount" placeholder="งบที่วางไว้สำหรับรายการนี้"/></div><input className="input" name="note" placeholder="รายละเอียด"/><SubmitButton className="btn btn-primary btn-full" pendingText="กำลังบันทึก...">+ บันทึกค่าใช้จ่าย</SubmitButton></form></details>}
  </div><BottomNav active="/wallet" /></main>;
}
