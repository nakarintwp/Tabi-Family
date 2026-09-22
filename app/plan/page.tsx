import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

const activities = [
  ["08:00", "🍳 Breakfast", "Hotel Gracery Shinjuku · 45 min"],
  ["09:10", "🚆 Shinjuku Station", "JR Chuo Line · Platform 9"],
  ["11:00", "🗻 Lake Kawaguchiko", "Sightseeing · Easy walk · 2h"],
  ["13:30", "🍜 Hoto lunch", "Family-friendly · Reservation saved"],
  ["15:00", "📷 Oishi Park", "Outdoor · Weather dependent"],
];

export default function PlanPage() {
  return <main className="shell"><div className="container"><AppHeader />
    <h1 className="page-title">แผนวันนี้</h1><p className="page-subtitle">Day 3 · Tokyo → Kawaguchiko · Family Pace: Comfortable</p>
    <div className="timeline">{activities.map(([time,title,meta]) => <div className="timeline-item" key={time}><span className="dot"/><div className="card"><div className="small muted">{time}</div><div className="activity-title" style={{marginTop:4}}>{title}</div><div className="activity-meta">{meta}</div></div></div>)}</div>
  </div><BottomNav active="/plan" /></main>;
}
