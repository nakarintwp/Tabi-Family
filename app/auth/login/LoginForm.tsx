"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(initialError || "");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!configured) { setSuccess(false); setMessage("ยังไม่ได้ตั้งค่า Supabase — ดู README และ .env.example"); return; }
    setLoading(true); setMessage(""); setSuccess(false);
    try {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", next);
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo.toString() } });
      if (error) { setMessage(error.message); setSuccess(false); }
      else { setMessage("ส่ง Magic Link แล้ว กรุณาตรวจอีเมลและกดลิงก์เข้าสู่ระบบ"); setSuccess(true); }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
      setSuccess(false);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-card">
      <Link href="/" className="brand"><span className="brand-mark">旅</span><span>Tabi Family</span></Link>
      <h1 className="page-title">เข้าสู่ระบบ</h1>
      <p className="page-subtitle">กรอกอีเมล ระบบจะส่ง Magic Link ให้ ไม่ต้องตั้งรหัสผ่าน</p>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="email">อีเมล</label><input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <button className="btn btn-primary btn-full" disabled={loading}>{loading ? "กำลังส่ง..." : "ส่ง Magic Link"}</button>
      </form>
      {message && <div className={success ? "success-box" : "error-box"} style={{ marginTop: 14 }}>{message}</div>}
      {!configured && <div className="notice" style={{ marginTop: 16 }}><span>⚙️</span><div>เพิ่ม <span className="code">NEXT_PUBLIC_SUPABASE_URL</span> และ <span className="code">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span> ใน Vercel</div></div>}
    </div>
  );
}
