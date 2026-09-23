"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function LoginForm({ next, initialError, staleSession = false }: { next: string; initialError?: string; staleSession?: boolean }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(initialError || "");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    if (!staleSession || !configured) return;
    const supabase = createClient();
    // Clear only this browser's cached auth session. The next login will create
    // a fresh session for the currently existing Supabase user.
    void supabase.auth.signOut({ scope: "local" });
  }, [staleSession, configured]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setSuccess(false);
  }

  async function signIn(e: FormEvent) {
    e.preventDefault();
    if (!configured) {
      setMessage("ยังไม่ได้ตั้งค่า Supabase Environment Variables");
      return;
    }
    if (!normalizedEmail || !password) return;

    setLoading(true);
    setMessage("");
    setSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error) {
        setMessage(
          error.message.toLowerCase().includes("invalid login")
            ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            : error.message,
        );
        return;
      }
      setSuccess(true);
      setMessage("เข้าสู่ระบบสำเร็จ กำลังเปิด Tabi Family…");
      window.location.assign(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function signUp(e: FormEvent) {
    e.preventDefault();
    if (!configured) {
      setMessage("ยังไม่ได้ตั้งค่า Supabase Environment Variables");
      return;
    }
    if (!normalizedEmail || !password) return;
    if (password.length < 8) {
      setMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });
      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.session) {
        setMessage(
          "บัญชีถูกสร้างแล้ว แต่ Supabase ยังเปิด Confirm email อยู่ กรุณาปิด Confirm email ตาม V4_3_UPGRADE.md เพื่อใช้ Email + Password โดยไม่ต้องเปิดลิงก์จากอีเมล",
        );
        return;
      }

      setSuccess(true);
      setMessage("สมัครและเข้าสู่ระบบสำเร็จ กำลังเปิด Tabi Family…");
      window.location.assign(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card password-auth-card">
      <Link href="/" className="brand">
        <span className="brand-mark">TF</span>
        <span>Tabi Family</span>
      </Link>

      <div className="auth-mode-tabs" role="tablist" aria-label="เข้าสู่ระบบหรือสมัครสมาชิก">
        <button
          type="button"
          className={mode === "login" ? "auth-mode-tab active" : "auth-mode-tab"}
          onClick={() => switchMode("login")}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          className={mode === "signup" ? "auth-mode-tab active" : "auth-mode-tab"}
          onClick={() => switchMode("signup")}
        >
          สมัครสมาชิก
        </button>
      </div>

      <div className="otp-head">
        <div className="otp-icon" aria-hidden="true">{mode === "login" ? "🔐" : "👤"}</div>
        <h1 className="page-title">{mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}</h1>
        <p className="page-subtitle">
          {mode === "login"
            ? "ใช้ Email + Password ได้ทั้งมือถือและคอม ไม่ต้องใช้ Magic Link"
            : "สมัครครั้งเดียว แล้วรับคำเชิญ Trip ผ่าน QR Code ได้"}
        </p>
      </div>

      <form onSubmit={mode === "login" ? signIn : signUp}>
        <div className="field">
          <label htmlFor="email">อีเมล</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="field">
          <label htmlFor="password">รหัสผ่าน</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="อย่างน้อย 8 ตัวอักษร"
          />
        </div>

        {mode === "signup" && (
          <div className="field">
            <label htmlFor="confirm-password">ยืนยันรหัสผ่าน</label>
            <input
              id="confirm-password"
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
            />
          </div>
        )}

        <button className="btn btn-primary btn-full" disabled={loading}>
          {loading
            ? mode === "login" ? "กำลังเข้าสู่ระบบ…" : "กำลังสร้างบัญชี…"
            : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>
      </form>

      {message && (
        <div className={success ? "success-box" : "error-box"} style={{ marginTop: 14 }}>
          {message}
        </div>
      )}

      <div className="notice password-auth-note" style={{ marginTop: 16 }}>
        <span>📱</span>
        <div>
          หลังเข้าสู่ระบบ สามารถสแกน QR จากเจ้าของทริปเพื่อเข้าร่วมเป็น <strong>Editor</strong> หรือ <strong>Viewer</strong> ได้ทันที
        </div>
      </div>

      {!configured && (
        <div className="notice" style={{ marginTop: 12 }}>
          <span>⚙️</span>
          <div>
            เพิ่ม <span className="code">NEXT_PUBLIC_SUPABASE_URL</span> และ{" "}
            <span className="code">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span> ใน Vercel
          </div>
        </div>
      )}
    </div>
  );
}
