"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!configured) { setMessage("ยังไม่ได้ตั้งค่า Supabase — ดู README และ .env.example"); return; }
    setLoading(true); setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setMessage(error ? error.message : "ส่ง Magic Link แล้ว กรุณาตรวจอีเมล");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally { setLoading(false); }
  }

  return <main className="auth-wrap"><div className="auth-card">
    <Link href="/" className="brand"><span className="brand-mark">旅</span><span>Tabi Family</span></Link>
    <h1 className="page-title">เข้าสู่ระบบ</h1><p className="page-subtitle">ใช้ Magic Link จาก Supabase Auth — ไม่ต้องจำรหัสผ่าน</p>
    <form onSubmit={submit}><div className="field"><label htmlFor="email">อีเมล</label><input id="email" className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" /></div>
      <button className="btn btn-primary btn-full" disabled={loading}>{loading ? "กำลังส่ง..." : "ส่ง Magic Link"}</button>
    </form>
    {message && <p className="small" style={{marginTop:14}}>{message}</p>}
    {!configured && <div className="notice" style={{marginTop:16}}><span>⚙️</span><div>Demo mode ทำงานได้อยู่แล้ว หากต้องการ Auth/Database ให้สร้าง <span className="code">.env.local</span></div></div>}
  </div></main>;
}
