import Link from "next/link";

export function AppHeader() {
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark">旅</span>
        <span>Tabi Family</span>
      </Link>
      <Link className="avatar" href="/account" aria-label="Account">👤</Link>
    </header>
  );
}
