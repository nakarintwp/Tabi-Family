import Link from "next/link";

const items = [
  ["/today", "☀", "Today"],
  ["/plan", "▣", "Plan"],
  ["/explore", "⌖", "Explore"],
  ["/wallet", "▤", "Wallet"],
  ["/more", "•••", "More"],
] as const;

function withTrip(href: string, tripId?: string) {
  if (!tripId) return href;
  const params = new URLSearchParams({ trip: tripId });
  return `${href}?${params.toString()}`;
}

export function BottomNav({ active, tripId }: { active: string; tripId?: string }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav-inner">
        {items.map(([href, icon, label]) => (
          <Link key={href} className={`nav-item ${active === href ? "active" : ""}`} href={withTrip(href, tripId)}>
            <b aria-hidden="true">{icon}</b><span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
