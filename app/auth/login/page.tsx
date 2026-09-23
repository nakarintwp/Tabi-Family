import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/trips";
  const initialError = params.error === "missing_env"
    ? "ยังไม่ได้ตั้งค่า Supabase Environment Variables"
    : undefined;

  return <main className="auth-wrap"><LoginForm next={next} initialError={initialError} /></main>;
}
