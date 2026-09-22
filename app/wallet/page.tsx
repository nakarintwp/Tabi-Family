import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const iconByCategory: Record<string, string> = { food: "🍜", transport: "🚆", hotel: "🏨", ticket: "🎟️", shopping: "🛍️", other: "💴" };

export default async function WalletPage() {
  let trip: null | { id: string; title: string; budget: number | null } = null;
  let expenses: Array<{ id: string; amount: number; currency: string; category: string; note: string | null; paid_at: string }> = [];
  let bookings: Array<{ id: string; booking_type: string; provider: string | null; reference_code: string | null }> = [];

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (userId) {
      const { data } = await supabase.from("trips").select("id,title,budget").eq("owner_id", userId).order("start_date", { ascending: true, nullsFirst: false }).limit(1).maybeSingle();
      trip = data;
      if (trip) {
        const [{ data: expenseRows }, { data: bookingRows }] = await Promise.all([
          supabase.from("expenses").select("id,amount,currency,category,note,paid_at").eq("trip_id", trip.id).order("paid_at", { ascending: false }).limit(20),
          supabase.from("bookings").select("id,booking_type,provider,reference_code").eq("trip_id", trip.id).order("created_at", { ascending: false }).limit(20),
        ]);
        expenses = expenseRows || [];
        bookings = bookingRows || [];
      }
    }
  }

  const thb = expenses.filter((e) => e.currency === "THB").reduce((sum, e) => sum + Number(e.amount), 0);
  const jpy = expenses.filter((e) => e.currency === "JPY").reduce((sum, e) => sum + Number(e.amount), 0);
  const percent = trip?.budget ? Math.min(100, Math.round(thb / Number(trip.budget) * 100)) : 0;

  return <main className="shell"><div className="container"><AppHeader />
    <h1 className="page-title">Trip Wallet</h1><p className="page-subtitle">{trip ? trip.title : "เก็บ booking และค่าใช้จ่ายของทริปไว้ในที่เดียว"}</p>
    {!trip ? <div className="empty-state"><div className="empty-icon">👛</div><h2>ยังไม่มีข้อมูล Wallet</h2><p>สร้างทริปก่อนเพื่อเริ่มบันทึกค่าใช้จ่าย</p><Link className="btn btn-primary" href="/trips/new">สร้างทริป</Link></div> : <>
      <div className="grid2"><div className="card metric"><span className="metric-icon">💴</span><strong>¥{jpy.toLocaleString("th-TH")}</strong><span>ใช้จ่ายที่ญี่ปุ่น</span></div><div className="card metric"><span className="metric-icon">💳</span><strong>฿{thb.toLocaleString("th-TH")}</strong><span>{trip.budget ? `งบ ฿${Number(trip.budget).toLocaleString("th-TH")}` : "ค่าใช้จ่าย THB"}</span></div></div>
      {trip.budget && <div className="card section"><div className="section-head"><h2>Budget</h2><span className="link">{percent}%</span></div><div className="progress"><i style={{width:`${percent}%`}}/></div></div>}
      <section className="section"><div className="section-head"><h2>รายการล่าสุด</h2><Link className="link" href={`/trips/${trip.id}`}>+ เพิ่ม</Link></div><div className="card">{expenses.length ? expenses.map((expense) => <div className="wallet-row" key={expense.id}><div className="wallet-icon">{iconByCategory[expense.category] || "💴"}</div><div><div className="activity-title">{expense.note || expense.category}</div><div className="activity-meta">{new Date(expense.paid_at).toLocaleDateString("th-TH")}</div></div><strong>{expense.currency === "JPY" ? "¥" : "฿"}{Number(expense.amount).toLocaleString("th-TH")}</strong></div>) : <p className="small muted">ยังไม่มีค่าใช้จ่าย</p>}</div></section>
      <section className="section"><div className="section-head"><h2>Bookings</h2><span className="small muted">{bookings.length} รายการ</span></div><div className="card">{bookings.length ? bookings.map((booking) => <div className="wallet-row" key={booking.id}><div className="wallet-icon">🎫</div><div><div className="activity-title">{booking.provider || booking.booking_type}</div><div className="activity-meta">{booking.reference_code || "ไม่มี reference"}</div></div><span>›</span></div>) : <p className="small muted">Booking form จะเพิ่มในขั้นถัดไป</p>}</div></section>
    </>}
  </div><BottomNav active="/wallet" /></main>;
}
