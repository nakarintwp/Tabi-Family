import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { DocumentOfflinePack } from "@/components/DocumentOfflinePack";
import { TripDocumentUploader } from "@/components/TripDocumentUploader";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { deleteTripDocument } from "./actions";

type DocRow = {
  id: string;
  title: string | null;
  provider: string | null;
  reference_code: string | null;
  confirmation_url: string | null;
  notes: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

type DocView = DocRow & { file_url: string | null };

function detail(details: Record<string, unknown> | null, key: string) {
  const value = details?.[key];
  return typeof value === "string" ? value : "";
}

function detailNumber(details: Record<string, unknown> | null, key: string) {
  const value = details?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatBytes(value: number | null) {
  if (value == null) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

const categoryIcon: Record<string, string> = {
  passport: "🛂",
  flight: "✈️",
  hotel: "🏨",
  rental_car: "🚙",
  insurance: "🛡️",
  rail_bus: "🚄",
  voucher: "🎟️",
  other: "📄",
};

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/documents`);
  const [{ data: trip }, { data: docs }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title").eq("id", id).single(),
    supabase
      .from("bookings")
      .select("id,title,provider,reference_code,confirmation_url,notes,details,created_at")
      .eq("trip_id", id)
      .eq("booking_type", "document")
      .order("created_at", { ascending: false }),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);

  if (!trip) notFound();
  const canEdit = role === "owner" || role === "editor";
  const rows = (docs || []) as DocRow[];

  const viewRows: DocView[] = await Promise.all(
    rows.map(async (row) => {
      const path = detail(row.details, "storage_path");
      if (!path) return { ...row, file_url: null };
      const { data } = await supabase.storage.from("trip-documents").createSignedUrl(path, 60 * 60);
      return { ...row, file_url: data?.signedUrl || null };
    }),
  );

  const packItems = viewRows.map((d) => {
    const fileName = detail(d.details, "file_name");
    return {
      title: d.title || "Document",
      reference: d.reference_code,
      url: d.confirmation_url,
      note: [fileName ? `Uploaded file: ${fileName}` : "", d.notes || ""].filter(Boolean).join(" · ") || null,
    };
  });

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">V10.1 Smart-linked Documents</span></div>
    <section className="planner-hero v8-doc-hero"><div><span className="eyebrow">TRIP DOCUMENT VAULT</span><h1>📂 Trip Documents</h1><p>{trip.title} · เพิ่มไฟล์แล้วระบบผูกกับทริปนี้อัตโนมัติ และ Booking Import สามารถผูกเอกสารกับรายการจองได้</p></div><div className="master-hero-actions"><Link className="btn btn-primary" href={`/trips/${id}/import-booking`}>📥 Import Booking</Link><Link className="btn btn-secondary" href={`/trips/${id}/bookings`}>Booking Center</Link></div></section>

    <section className="trip-document-link-status"><span>✅</span><div><strong>Auto Trip Link เปิดใช้งาน</strong><p>เอกสารใหม่ทุกชิ้นจากหน้านี้จะบันทึกด้วย Trip ID ของ <b>{trip.title}</b> อัตโนมัติ</p></div></section>

    <DocumentOfflinePack tripId={id} items={packItems}/>

    <section className="section"><div className="section-head"><h2>เอกสารของทริปนี้</h2><span className="small muted">{viewRows.length} รายการ</span></div>
      {viewRows.length ? <div className="document-grid">{viewRows.map((d) => {
        const category = detail(d.details, "doc_category") || "other";
        const fileName = detail(d.details, "file_name");
        const fileSize = detailNumber(d.details, "file_size");
        const autoLinked = d.details?.auto_trip_link === true;
        const linkedBookingId = detail(d.details, "linked_booking_id");
        return <article className="document-card" key={d.id}>
          <div className="document-icon">{categoryIcon[category] || "📄"}</div>
          <div className="document-card-body">
            <div className="document-card-topline"><span className="activity-label">{category.replaceAll("_", " ")}</span>{autoLinked && <span className="trip-linked-chip">🔗 Trip linked</span>}{linkedBookingId && <span className="trip-linked-chip">🎫 Booking linked</span>}</div>
            <h3>{d.title || "Document"}</h3>
            {d.provider && <p>{d.provider}</p>}
            {fileName && <p className="document-file-meta"><strong>{fileName}</strong>{fileSize != null && <span>{formatBytes(fileSize)}</span>}</p>}
            {d.reference_code && <div className="reference-chip">Ref: {d.reference_code}</div>}
            {d.notes && <p className="muted small">{d.notes}</p>}
            <div className="today-action-row">
              {d.file_url && <a className="btn btn-primary btn-small" href={d.file_url} target="_blank" rel="noreferrer">เปิดไฟล์ ↗</a>}
              {d.confirmation_url && <a className="btn btn-secondary btn-small" href={d.confirmation_url} target="_blank" rel="noreferrer">เปิดลิงก์ ↗</a>}
              {canEdit && <form action={deleteTripDocument}><input type="hidden" name="trip_id" value={id}/><input type="hidden" name="document_id" value={d.id}/><button className="btn btn-secondary btn-small" type="submit">ลบ</button></form>}
            </div>
          </div>
        </article>;
      })}</div> : <div className="empty-mini">ยังไม่มีเอกสาร · เพิ่มไฟล์ด้านล่างได้เลย</div>}
    </section>

    {canEdit && <TripDocumentUploader tripId={id} tripTitle={trip.title || "Trip"} />}

    <section className="notice"><span>🔐</span><div><strong>เอกสารเก็บแบบ Private</strong><p>ไฟล์อัปโหลดอยู่ใน Supabase Storage แบบไม่ Public และเปิดผ่านลิงก์ชั่วคราวสำหรับสมาชิกที่มีสิทธิ์ใน Trip เท่านั้น ไม่แนะนำให้ใส่รหัสผ่านหรือเลขบัตรเครดิตใน Notes</p></div></section>
  </div><BottomNav active="/wallet" /></main>;
}
