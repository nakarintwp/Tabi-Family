import Link from "next/link";

export function AppHeader() {
  return (
    <header className="topbar winter-topbar">
      <Link href="/" className="brand winter-brand">
        <span className="brand-mark">旅</span>
        <span className="brand-copy">
          <strong>Tabi Family</strong>
          <small>冬の家族旅 · Winter Japan</small>
        </span>
      </Link>
      <Link className="avatar winter-avatar" href="/account" aria-label="Account">
        <span aria-hidden="true">👤</span>
      </Link>
    </header>
  );
}
