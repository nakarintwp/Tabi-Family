import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { TRIP_TEMPLATES } from "@/lib/discovery";
import { requireVerifiedUser } from "@/lib/supabase/auth";

export default async function TemplatesPage() {
  await requireVerifiedUser("/templates");
  return <main className="shell"><div className="container"><AppHeader />
    <div className="page-head-row"><div><span className="eyebrow">READY-MADE PLANS</span><h1 className="page-title">Trip Templates</h1><p className="page-subtitle">เริ่มจากแผนตัวอย่าง แล้วแก้เวลา สถานที่ และการเดินทางให้เข้ากับครอบครัวของคุณ</p></div></div>
    <div className="template-grid">
      {TRIP_TEMPLATES.map((template) => <article className={`template-card trip-cover cover-${template.coverStyle}`} key={template.id}>
        <div className="template-cover-copy"><span className="template-emoji">{template.coverEmoji}</span><div><span className="eyebrow">{template.days} DAYS · {template.pace}</span><h2>{template.title}</h2><p>{template.subtitle}</p></div></div>
        <div className="tag-row">{template.tags.map((tag) => <span className="mini-tag" key={tag}>{tag}</span>)}</div>
        <div className="template-cities">{template.cities.join(" → ")}</div>
        <div className="template-preview-list">{template.activities.slice(0,4).map((activity) => <span key={`${activity.day}-${activity.title}`}>Day {activity.day} · {activity.startTime || "—"} {activity.title}</span>)}{template.activities.length > 4 && <span>+ อีก {template.activities.length - 4} รายการ</span>}</div>
        <Link className="btn btn-primary btn-full" href={`/trips/new?template=${encodeURIComponent(template.id)}`}>ใช้ Template นี้</Link>
      </article>)}
    </div>
  </div><BottomNav active="/explore" /></main>;
}
