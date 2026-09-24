import Link from "next/link";

export function AppHeader() {
  return (
    <header className="topbar cartoon-topbar">
      <Link href="/" className="brand cartoon-brand">
        <span className="brand-mark">TF</span>
        <span className="brand-copy">
          <strong>Tabi Family</strong>
          <small>Discover · Plan · Go</small>
        </span>
      </Link>
      <div className="header-actions">
        <span className="global-build-chip" title="Build version">V11.2</span>
        <Link className="avatar cartoon-avatar" href="/account" aria-label="Account">
          <span aria-hidden="true">👤</span>
        </Link>
      </div>
    </header>
  );
}
