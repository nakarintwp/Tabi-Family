import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; session?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/trips";
  const staleSession = params.session === "expired";
  const initialError = params.error === "missing_env"
    ? "ยังไม่ได้ตั้งค่า Supabase Environment Variables"
    : staleSession
      ? "เซสชันเดิมใช้ไม่ได้แล้ว หรือบัญชีถูกลบ กรุณาเข้าสู่ระบบใหม่"
      : undefined;

  return <main className="auth-wrap"><LoginForm next={next} initialError={initialError} staleSession={staleSession} /></main>;
}
