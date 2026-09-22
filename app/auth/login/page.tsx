import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/trips";
  const initialError = params.error === "missing_env" ? "ยังไม่ได้ตั้งค่า Supabase Environment Variables" : params.error === "auth_callback" ? "ลิงก์เข้าสู่ระบบไม่สำเร็จหรือหมดอายุ กรุณาลองใหม่" : undefined;

  return <main className="auth-wrap"><LoginForm next={next} initialError={initialError} /></main>;
}
