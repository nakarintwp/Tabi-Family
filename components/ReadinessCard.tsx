import type { CSSProperties } from "react";
import Link from "next/link";
import type { ReadinessItem } from "@/lib/trip-readiness";

export function ReadinessCard({ tripId, score, label, items, compact = false }: { tripId: string; score: number; label: string; items: ReadinessItem[]; compact?: boolean }) {
  const nextItems = items.filter((item) => !item.done).slice(0, compact ? 2 : items.length);
  return <section className={`card readiness-card ${compact ? "compact" : ""}`}>
    <div className="readiness-top"><div><span className="activity-label">TRIP READINESS</span><strong>{score}%</strong><small>{label}</small></div><div className="readiness-ring" style={{ "--score": `${score * 3.6}deg` } as CSSProperties}><span>{score}</span></div></div>
    <div className="progress-track"><span style={{ width: `${score}%` }} /></div>
    {nextItems.length ? <div className="readiness-next">{nextItems.map((item) => <div className="readiness-row" key={item.key}><span>{item.done ? "✓" : "○"}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div><b>{item.earned}/{item.points}</b></div>)}</div> : <div className="readiness-complete">✓ พร้อมออกเดินทาง</div>}
    {compact && <Link className="link" href={`/trips/${tripId}/readiness`}>ดู Checklist ทั้งหมด ›</Link>}
  </section>;
}
