import Link from "next/link";

const items = [
  ["/", "⌂", "Home"],
  ["/today", "☀", "Today"],
  ["/explore", "✨", "Explore"],
  ["/trips", "🗾", "Trips"],
  ["/plan", "☷", "Plan"],
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
