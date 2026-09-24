"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createImportedBooking } from "@/app/trips/[id]/import-booking/actions";
import { documentCategoryForBooking, extractLocalFileText, inferBookingDraft, type ImportedBookingDraft } from "@/lib/v10";

type ExistingDocument = { id: string; title: string; provider?: string | null; reference_code?: string | null; doc_category?: string | null };
type TransportOption = { id: string; mode: string; origin: string; destination: string; booking_reference?: string | null };

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const emptyDraft: ImportedBookingDraft = { bookingType: "other", title: "", provider: "", referenceCode: "", startAt: "", endAt: "", amount: "", currency: "JPY", origin: "", destination: "", confidence: 10, evidence: [] };

function fileSafe(name: string) {
  return name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-120) || "booking-file";
}


function allowedFile(file: File) {
  return /\.(pdf|txt|csv|json|jpg|jpeg|png|webp)$/i.test(file.name);
}


export function BookingImportWizard({ tripId, tripTitle, tripCities, documents, transports }: { tripId: string; tripTitle: string; tripCities: string[]; documents: ExistingDocument[]; transports: TransportOption[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [draft, setDraft] = useState<ImportedBookingDraft>(emptyDraft);
  const [documentId, setDocumentId] = useState("");
  const [transportId, setTransportId] = useState("");
  const [saveDocument, setSaveDocument] = useState(true);
  const [createTransport, setCreateTransport] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const suggestedCategory = documentCategoryForBooking(draft.bookingType);
  const recommendedExisting = useMemo(() => documents.find((doc) => doc.doc_category === suggestedCategory && !documentId), [documents, suggestedCategory, documentId]);

  async function analyze() {
    setAnalyzing(true); setError(""); setMessage("");
    try {
      let extracted = sourceText.trim();
      if (file) {
        if (file.size > MAX_FILE_BYTES) throw new Error("ไฟล์ต้องไม่เกิน 15 MB");
        if (!allowedFile(file)) throw new Error("รองรับ PDF, TXT, CSV, JSON, JPG, PNG และ WEBP");
        const bytes = await file.arrayBuffer();
        let localText = extractLocalFileText(file.name, file.type, bytes);
        if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
          setOcrProgress(1);
          const Tesseract = await import("tesseract.js");
          const imageUrl = URL.createObjectURL(file);
          try {
            const result = await Tesseract.recognize(imageUrl, "eng+jpn", { logger: (m) => { if (m.status === "recognizing text" && typeof m.progress === "number") setOcrProgress(Math.max(1, Math.round(m.progress * 100))); } });
            localText = result.data.text || "";
          } finally { URL.revokeObjectURL(imageUrl); }
        }
        extracted = [localText, sourceText].filter(Boolean).join("\n");
      }
      if (!file && !extracted) throw new Error("เลือกไฟล์หรือวางข้อความ Booking ก่อน");
      const parsed = inferBookingDraft(extracted, file?.name || "", tripCities);
      setDraft(parsed);
      const category = documentCategoryForBooking(parsed.bookingType);
      const docSuggestion = documents.find((doc) => doc.doc_category === category && (parsed.referenceCode ? doc.reference_code?.toLowerCase() === parsed.referenceCode.toLowerCase() : true));
      setDocumentId(docSuggestion?.id || "");
      const mode = parsed.bookingType === "rental_car" ? "car" : parsed.bookingType;
      const segmentSuggestion = transports.find((segment) => segment.mode === mode && (!parsed.origin || segment.origin.toLowerCase().includes(parsed.origin.toLowerCase()) || parsed.origin.toLowerCase().includes(segment.origin.toLowerCase())));
      setTransportId(segmentSuggestion?.id || "");
      if ((file?.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(file?.name || "")) && !sourceText.trim()) {
        setMessage(`OCR ใน Browser เสร็จแล้ว · ความมั่นใจการแยกข้อมูล ${parsed.confidence}% · กรุณาตรวจทุกช่องก่อนบันทึก`);
      } else if (file?.type === "application/pdf" && !extracted.trim()) {
        setMessage("PDF นี้ไม่มี text layer ที่อ่านได้แบบ local — วางข้อความจาก PDF เพิ่มแล้ววิเคราะห์อีกครั้ง");
      } else {
        setMessage(`วิเคราะห์เสร็จแล้ว · ความมั่นใจ ${parsed.confidence}% · กรุณาตรวจข้อมูลก่อนบันทึก`);
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "วิเคราะห์ไฟล์ไม่สำเร็จ"); }
    finally { setAnalyzing(false); setOcrProgress(0); }
  }

  async function uploadAsDocument() {
    if (!file || !saveDocument) return "";
    if (!allowedFile(file)) throw new Error("ชนิดไฟล์ไม่รองรับสำหรับ Booking Import");
    const storagePath = `${tripId}/${crypto.randomUUID()}-${fileSafe(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("trip-documents").upload(storagePath, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });
    if (uploadError) throw new Error(`อัปโหลดเอกสารไม่สำเร็จ: ${uploadError.message}`);
    const details = {
      doc_category: documentCategoryForBooking(draft.bookingType), source: "v10_booking_import", storage_path: storagePath,
      file_name: file.name, file_size: file.size, mime_type: file.type || null, auto_trip_link: true, linked_trip_id: tripId,
      import_confidence: draft.confidence, pending_booking_link: true,
    };
    const { data, error: insertError } = await supabase.from("bookings").insert({
      trip_id: tripId, booking_type: "document", title: draft.title ? `${draft.title} · source` : file.name,
      provider: draft.provider || null, reference_code: draft.referenceCode || null, details,
    }).select("id").single();
    if (insertError || !data) {
      await supabase.storage.from("trip-documents").remove([storagePath]);
      throw new Error(`สร้าง Trip Document ไม่สำเร็จ: ${insertError?.message || "unknown error"}`);
    }
    return data.id as string;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError(""); setMessage("");
    let newDocId = "";
    try {
      if (!draft.title.trim()) throw new Error("กรุณากดวิเคราะห์และตรวจชื่อ Booking ก่อน");
      newDocId = await uploadAsDocument();
      const form = new FormData(event.currentTarget);
      form.set("trip_id", tripId);
      form.set("booking_type", draft.bookingType);
      form.set("title", draft.title);
      form.set("provider", draft.provider);
      form.set("reference_code", draft.referenceCode);
      form.set("start_at", draft.startAt);
      form.set("end_at", draft.endAt);
      form.set("amount", draft.amount);
      form.set("currency", draft.currency);
      form.set("origin", draft.origin);
      form.set("destination", draft.destination);
      form.set("confidence", String(draft.confidence));
      form.set("source_file_name", file?.name || "");
      form.set("source_excerpt", sourceText.slice(0, 2500));
      form.set("document_id", newDocId || documentId);
      form.set("transport_id", transportId);
      if (createTransport) form.set("create_transport", "on"); else form.delete("create_transport");
      await createImportedBooking(form);
      setMessage("สร้าง Booking และผูกข้อมูลกับ Trip เรียบร้อย ✓");
      router.push(`/trips/${tripId}/bookings`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "บันทึก Booking ไม่สำเร็จ");
    } finally { setSaving(false); }
  }

  const update = <K extends keyof ImportedBookingDraft>(key: K, value: ImportedBookingDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const travelType = ["flight", "train", "bus", "rental_car"].includes(draft.bookingType);

  return <div className="booking-import-wizard">
    <section className="section import-source-card">
      <div className="section-head"><h2>1 · นำเข้า Booking</h2><span className="badge success">Local · ¥0 AI API</span></div>
      <label className="document-upload-zone import-zone"><span className="document-upload-icon">📥</span><span><strong>เลือก Voucher / Booking file</strong><small>PDF text layer, TXT, CSV, JSON และ OCR รูป JPG/PNG/WEBP ใน Browser · สูงสุด 15 MB</small></span><input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.json,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
      {file && <div className="import-file-pill"><span>📎</span><strong>{file.name}</strong><small>{Math.round(file.size / 1024)} KB</small><button type="button" className="text-button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}>เอาออก</button></div>}
      <div className="field"><label>ข้อความจาก Email / Voucher (ช่วยเพิ่มความแม่นยำ)</label><textarea className="textarea" rows={7} value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="วางข้อความยืนยันการจอง เช่น Hotel name, Booking No., Check-in, ราคา..." /></div>
      <button type="button" className="btn btn-primary btn-full" disabled={analyzing} onClick={analyze}>{analyzing ? (ocrProgress ? `OCR ${ocrProgress}%...` : "กำลังวิเคราะห์...") : "✨ วิเคราะห์ Booking / OCR"}</button>
      {message && <div className="form-alert form-alert-success">{message}</div>}{error && <div className="form-alert form-alert-error">{error}</div>}
    </section>

    <form onSubmit={submit} className="section import-review-card">
      <div className="section-head"><h2>2 · ตรวจข้อมูลก่อนบันทึก</h2><span className={`import-confidence confidence-${draft.confidence >= 70 ? "high" : draft.confidence >= 45 ? "medium" : "low"}`}>{draft.confidence}%</span></div>
      {draft.evidence.length > 0 && <div className="import-evidence">{draft.evidence.map((item) => <span key={item}>✓ {item}</span>)}</div>}
      <div className="grid2"><div className="field"><label>ประเภท</label><select className="select" value={draft.bookingType} onChange={(e) => update("bookingType", e.target.value as ImportedBookingDraft["bookingType"])}><option value="hotel">Hotel</option><option value="flight">Flight</option><option value="train">Train</option><option value="bus">Bus</option><option value="rental_car">Rental car</option><option value="restaurant">Restaurant</option><option value="ticket">Ticket</option><option value="other">Other</option></select></div><div className="field"><label>Booking / Confirmation No.</label><input className="input" value={draft.referenceCode} onChange={(e) => update("referenceCode", e.target.value)} /></div></div>
      <div className="field"><label>ชื่อ Booking</label><input className="input" value={draft.title} onChange={(e) => update("title", e.target.value)} required /></div>
      <div className="field"><label>Provider</label><input className="input" value={draft.provider} onChange={(e) => update("provider", e.target.value)} placeholder="โรงแรม / สายการบิน / บริษัทเช่ารถ" /></div>
      <div className="grid2"><div className="field"><label>เริ่ม</label><input className="input" type="datetime-local" value={draft.startAt} onChange={(e) => update("startAt", e.target.value)} /></div><div className="field"><label>สิ้นสุด</label><input className="input" type="datetime-local" value={draft.endAt} onChange={(e) => update("endAt", e.target.value)} /></div></div>
      <div className="grid2"><div className="field"><label>ยอด</label><input className="input" inputMode="decimal" value={draft.amount} onChange={(e) => update("amount", e.target.value)} /></div><div className="field"><label>สกุลเงิน</label><select className="select" value={draft.currency} onChange={(e) => update("currency", e.target.value as ImportedBookingDraft["currency"])}><option value="JPY">JPY</option><option value="THB">THB</option><option value="USD">USD</option></select></div></div>
      {travelType && <div className="grid2"><div className="field"><label>ต้นทาง / จุดรับ</label><input className="input" value={draft.origin} onChange={(e) => update("origin", e.target.value)} /></div><div className="field"><label>ปลายทาง / จุดคืน</label><input className="input" value={draft.destination} onChange={(e) => update("destination", e.target.value)} /></div></div>}
      <div className="grid2"><select className="select" name="status" defaultValue="confirmed"><option value="confirmed">Confirmed</option><option value="planned">Planned</option><option value="cancelled">Cancelled</option></select><select className="select" name="payment_status" defaultValue="unknown"><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="unknown">Unknown</option></select></div>
      <input className="input" name="confirmation_url" type="url" placeholder="Confirmation URL (ถ้ามี)" />
      <textarea className="textarea" name="notes" rows={3} placeholder="หมายเหตุเพิ่มเติม" />

      <div className="auto-link-panel"><div><strong>🔗 V10.1 Smart Linking</strong><small>ผูก Booking กับเอกสาร/Transport ของทริปอัตโนมัติ</small></div>
        {file && <label className="toggle-row"><input type="checkbox" checked={saveDocument} onChange={(e) => setSaveDocument(e.target.checked)} /> เก็บไฟล์นี้เป็น Trip Document และผูกกับ Booking</label>}
        {!file && <div className="field"><label>เอกสารที่เกี่ยวข้อง</label><select className="select" value={documentId} onChange={(e) => setDocumentId(e.target.value)}><option value="">ให้ระบบหาอัตโนมัติ</option>{documents.map((doc) => <option key={doc.id} value={doc.id}>{doc.title}{doc.reference_code ? ` · ${doc.reference_code}` : ""}</option>)}</select>{recommendedExisting && <small className="field-help">แนะนำ: {recommendedExisting.title}</small>}</div>}
        {travelType && <div className="field"><label>Transport segment ที่เกี่ยวข้อง</label><select className="select" value={transportId} onChange={(e) => setTransportId(e.target.value)}><option value="">ยังไม่ผูก segment เดิม</option>{transports.map((segment) => <option key={segment.id} value={segment.id}>{segment.mode} · {segment.origin} → {segment.destination}</option>)}</select></div>}
        {travelType && draft.origin && draft.destination && <label className="toggle-row"><input type="checkbox" checked={createTransport} onChange={(e) => setCreateTransport(e.target.checked)} /> ถ้ายังไม่มี ให้สร้าง Transport segment จาก Booking นี้</label>}
      </div>
      {error && <div className="form-alert form-alert-error">{error}</div>}
      <button className="btn btn-primary btn-full" type="submit" disabled={saving || !draft.title}>{saving ? "กำลังสร้างและผูกข้อมูล..." : `✓ บันทึกเข้า ${tripTitle}`}</button>
    </form>
  </div>;
}
