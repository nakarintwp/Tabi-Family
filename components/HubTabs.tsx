import Link from "next/link";

export type PlanHubSection = "itinerary" | "map" | "route" | "check";
export type WalletHubSection = "overview" | "bookings" | "documents" | "expenses" | "inbox";

export function PlanHubTabs({ tripId, active }: { tripId: string; active: PlanHubSection }) {
  const items: Array<[PlanHubSection, string, string]> = [
    ["itinerary", `/trips/${tripId}/master-plan`, "Itinerary"],
    ["map", `/trips/${tripId}/map`, "Map"],
    ["route", `/trips/${tripId}/route`, "Route"],
    ["check", `/trips/${tripId}/smart-engine`, "Check"],
  ];
  return <nav className="hub-tabs" aria-label="Plan sections">{items.map(([key, href, label]) => <Link key={key} className={`hub-tab ${active === key ? "active" : ""}`} href={href}>{label}</Link>)}</nav>;
}

export function WalletHubTabs({ tripId, active }: { tripId: string; active: WalletHubSection }) {
  const items: Array<[WalletHubSection, string, string]> = [
    ["overview", `/trips/${tripId}/wallet`, "Overview"],
    ["bookings", `/trips/${tripId}/bookings`, "Bookings"],
    ["documents", `/trips/${tripId}/documents`, "Documents"],
    ["expenses", `/trips/${tripId}/budget`, "Expenses"],
    ["inbox", `/trips/${tripId}/inbox`, "Inbox"],
  ];
  return <nav className="hub-tabs wallet-hub-tabs" aria-label="Wallet sections">{items.map(([key, href, label]) => <Link key={key} className={`hub-tab ${active === key ? "active" : ""}`} href={href}>{label}</Link>)}</nav>;
}
