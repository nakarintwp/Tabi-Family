import Link from "next/link";

const items = [
  ["/", "⌂", "Home"],
  ["/trips", "🗾", "Trips"],
  ["/plan", "☷", "Plan"],
  ["/map", "⌖", "Map"],
  ["/wallet", "▣", "Wallet"],
] as const;

export function BottomNav({ active }: { active: string }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav-inner">
        {items.map(([href, icon, label]) => (
          <Link key={href} className={`nav-item ${active === href ? "active" : ""}`} href={href}>
            <b aria-hidden="true">{icon}</b><span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
