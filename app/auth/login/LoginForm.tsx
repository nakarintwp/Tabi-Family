"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "otp";

const RESEND_SECONDS = 60;

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState(initialError || "");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLeft, setResendLeft] = useState(0);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    if (resendLeft <= 0) return;
    const timer = window.setInterval(() => {
      setResendLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendLeft]);

  async function sendOtp(e?: FormEvent) {
    e?.preventDefault();
    if (!configured) {
      setSuccess(false);
      setMessage("ยังไม่ได้ตั้งค่า Supabase — ดู README และ .env.example");
      return;
    }
    if (!normalizedEmail) {
      setSuccess(false);
      setMessage("กรุณากรอกอีเมล");
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", next);

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTo.toString(),
          shouldCreateUser: true,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setStep("otp");
      setOtp("");
      setSuccess(true);
      setMessage("ส่งรหัสเข้าสู่ระบบแล้ว กรุณาตรวจอีเมลและกรอกรหัส OTP");
      setResendLeft(RESEND_SECONDS);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!configured) return;

    const token = otp.replace(/\D/g, "");
    if (token.length < 6 || token.length > 8) {
      setSuccess(false);
      setMessage("กรุณากรอกรหัส OTP ให้ครบ");
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: "email",
      });

      if (error) {
        setMessage(
          error.message.toLowerCase().includes("expired")
            ? "รหัสหมดอายุแล้ว กรุณากดส่งรหัสใหม่"
            : "รหัสไม่ถูกต้องหรือหมดอายุ กรุณาตรวจสอบแล้วลองอีกครั้ง",
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

  function changeEmail() {
    setStep("email");
    setOtp("");
    setMessage("");
    setSuccess(false);
    setResendLeft(0);
  }

  return (
    <div className="auth-card otp-auth-card">
      <Link href="/" className="brand">
        <span className="brand-mark">旅</span>
        <span>Tabi Family</span>
      </Link>

      <div className="otp-head">
        <div className="otp-icon" aria-hidden="true">✉️</div>
        <h1 className="page-title">เข้าสู่ระบบ</h1>
        <p className="page-subtitle">
          {step === "email"
            ? "รับรหัส OTP ทางอีเมล แล้วกรอกบนมือถือเครื่องนี้ได้เลย"
            : `ส่งรหัสไปที่ ${normalizedEmail}`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={sendOtp}>
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
          <button className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "กำลังส่งรหัส…" : "ส่งรหัสเข้าสู่ระบบ"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <div className="field">
            <label htmlFor="otp">รหัส OTP</label>
            <input
              id="otp"
              className="input otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={8}
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="000000"
              aria-describedby="otp-help"
            />
            <small id="otp-help" className="field-help">
              เปิดอีเมลดูรหัส แล้วกลับมากรอกหน้านี้ ไม่จำเป็นต้องเปิดลิงก์ใน Gmail
            </small>
          </div>

          <button className="btn btn-primary btn-full" disabled={loading || otp.length < 6}>
            {loading ? "กำลังตรวจสอบ…" : "ยืนยันและเข้าสู่ระบบ"}
          </button>

          <div className="otp-actions">
            <button type="button" className="text-button" onClick={changeEmail} disabled={loading}>
              เปลี่ยนอีเมล
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => sendOtp()}
              disabled={loading || resendLeft > 0}
            >
              {resendLeft > 0 ? `ส่งใหม่ได้ใน ${resendLeft} วินาที` : "ส่งรหัสใหม่"}
            </button>
          </div>
        </form>
      )}

      {message && (
        <div className={success ? "success-box" : "error-box"} style={{ marginTop: 14 }}>
          {message}
        </div>
      )}

      {step === "otp" && (
        <div className="notice otp-fallback" style={{ marginTop: 14 }}>
          <span>💡</span>
          <div>
            หากอีเมลยังแสดงเฉพาะปุ่ม Magic Link ให้แก้ Supabase Email Template ตามไฟล์ <span className="code">V4_2_UPGRADE.md</span>
          </div>
        </div>
      )}

      {!configured && (
        <div className="notice" style={{ marginTop: 16 }}>
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
