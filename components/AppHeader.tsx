import Link from "next/link";

export function AppHeader() {
  return (
    <header className="topbar cartoon-topbar">
      <Link href="/" className="brand cartoon-brand">
        <span className="brand-mark">TF</span>
        <span className="brand-copy">
          <strong>Tabi Family</strong>
          <small>Family Trip Planner · Cartoon Blue</small>
        </span>
      </Link>
      <Link className="avatar cartoon-avatar" href="/account" aria-label="Account">
        <span aria-hidden="true">👤</span>
      </Link>
    </header>
  );
}
