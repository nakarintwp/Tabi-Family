import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { COVER_STYLES } from "@/lib/discovery";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { updateTripCover } from "./actions";

export default async function CoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/cover`);
  const [{ data: trip }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title,cities,cover_style,cover_emoji,cover_tagline").eq("id", id).single(),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);
  if (!trip) notFound();
  const isOwner = role === "owner";
  const style = trip.cover_style || "sky";

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}/more`} className="back-link">‹ More</Link><span className="planner-counter">Trip Cover</span></div>
    <section className={`cover-preview trip-cover cover-${style}`}><span className="cover-preview-emoji">{trip.cover_emoji || "🧳"}</span><div><span className="eyebrow">TRIP COVER</span><h1>{trip.title}</h1><p>{trip.cover_tagline || trip.cities?.join(" • ") || "Family journey"}</p></div></section>

    {!isOwner && <div className="notice"><span>👀</span><div><strong>Owner เท่านั้นที่เปลี่ยน Cover ได้</strong><br/><span className="muted">สมาชิกยังเห็น Cover เดียวกันทั้งทริป</span></div></div>}

    {isOwner && <form className="form-card cover-form" action={updateTripCover}>
      <input type="hidden" name="trip_id" value={id} />
      <div className="field"><label>ธีม Cover</label><div className="cover-preset-grid">{COVER_STYLES.map((item) => <label className={`cover-option cover-${item.id}`} key={item.id}><input type="radio" name="cover_style" value={item.id} defaultChecked={style === item.id} /><span>{item.emoji}</span><strong>{item.label}</strong></label>)}</div></div>
      <div className="grid2"><div className="field"><label>Emoji</label><input className="input" name="cover_emoji" defaultValue={trip.cover_emoji || "🧳"} maxLength={12} /></div><div className="field"><label>Tagline</label><input className="input" name="cover_tagline" defaultValue={trip.cover_tagline || ""} placeholder="เช่น Winter family adventure" maxLength={120} /></div></div>
      <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังบันทึก...">บันทึก Trip Cover</SubmitButton>
    </form>}
  </div><BottomNav active="/more" tripId={id} /></main>;
}
