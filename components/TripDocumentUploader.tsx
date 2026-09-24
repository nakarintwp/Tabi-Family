"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

function cleanFileName(name: string) {
  const cleaned = name
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);
  return cleaned || "document";
}

export function TripDocumentUploader({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);
    setMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    const externalUrl = String(data.get("confirmation_url") || "").trim();
    const title = String(data.get("title") || "").trim();
    const docCategory = String(data.get("doc_category") || "other").trim();

    if (!title) {
      setError("กรุณาใส่ชื่อเอกสาร");
      setPending(false);
      return;
    }

    const hasFile = file instanceof File && file.size > 0;
    if (!hasFile && !externalUrl) {
      setError("กรุณาเลือกไฟล์ หรือใส่ลิงก์เอกสารอย่างน้อย 1 อย่าง");
      setPending(false);
      return;
    }

    let storagePath: string | null = null;

    try {
      if (hasFile) {
        if (file.size > MAX_FILE_BYTES) throw new Error("ไฟล์ต้องมีขนาดไม่เกิน 15 MB");
        if (file.type && !ACCEPTED_MIME_TYPES.has(file.type)) {
          throw new Error("รองรับ PDF, JPG, PNG, WEBP, Word, Excel และ TXT");
        }

        storagePath = `${tripId}/${crypto.randomUUID()}-${cleanFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("trip-documents")
          .upload(storagePath, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });
        if (uploadError) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${uploadError.message}`);
      }

      const details = {
        doc_category: docCategory,
        source: hasFile ? (externalUrl ? "upload_and_url" : "upload") : "external_url",
        storage_path: storagePath,
        file_name: hasFile ? file.name : null,
        file_size: hasFile ? file.size : null,
        mime_type: hasFile ? file.type || null : null,
        auto_trip_link: true,
        linked_trip_id: tripId,
      };

      const { error: insertError } = await supabase.from("bookings").insert({
        trip_id: tripId,
        booking_type: "document",
        title,
        provider: String(data.get("provider") || "").trim() || null,
        reference_code: String(data.get("reference_code") || "").trim() || null,
        confirmation_url: externalUrl || null,
        notes: String(data.get("notes") || "").trim() || null,
        details,
      });

      if (insertError) {
        if (storagePath) await supabase.storage.from("trip-documents").remove([storagePath]);
        throw new Error(`บันทึกเอกสารไม่สำเร็จ: ${insertError.message}`);
      }

      formRef.current?.reset();
      setMessage(`เพิ่มเอกสารและผูกกับทริป “${tripTitle}” อัตโนมัติแล้ว`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "เกิดข้อผิดพลาดในการเพิ่มเอกสาร");
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="add-activity-panel" open>
      <summary>
        <span className="plus-circle">＋</span>
        <span>
          <strong>เพิ่มเอกสาร</strong>
          <small>อัปโหลดไฟล์หรือวางลิงก์ · ระบบจะผูกกับทริปนี้ให้อัตโนมัติ</small>
        </span>
      </summary>
      <form ref={formRef} onSubmit={onSubmit} className="inline-form">
        <div className="trip-auto-link-banner">
          <span>🔗</span>
          <div><strong>ผูกอัตโนมัติกับทริป</strong><small>{tripTitle}</small></div>
        </div>
        <div className="grid2">
          <select className="select" name="doc_category" defaultValue="voucher">
            <option value="passport">Passport copy</option>
            <option value="flight">Flight ticket</option>
            <option value="hotel">Hotel voucher</option>
            <option value="rental_car">Rental car</option>
            <option value="insurance">Travel insurance</option>
            <option value="rail_bus">JR / Bus ticket</option>
            <option value="voucher">Voucher / QR</option>
            <option value="other">Other</option>
          </select>
          <input className="input" name="title" placeholder="ชื่อเอกสาร" required />
        </div>
        <label className="document-upload-zone">
          <span className="document-upload-icon">⬆️</span>
          <span><strong>เลือกไฟล์จากเครื่อง</strong><small>PDF, รูปภาพ, Word, Excel, TXT · สูงสุด 15 MB</small></span>
          <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt" />
        </label>
        <div className="document-or"><span>หรือ</span></div>
        <input className="input" name="confirmation_url" type="url" placeholder="https://... ลิงก์ Drive / Voucher / QR (ถ้ามี)" />
        <div className="grid2">
          <input className="input" name="provider" placeholder="ผู้ให้บริการ / โรงแรม / สายการบิน" />
          <input className="input" name="reference_code" placeholder="เลขอ้างอิง / Booking No." />
        </div>
        <textarea className="textarea" name="notes" rows={3} placeholder="หมายเหตุ เช่น เลขกรมธรรม์ วันหมดอายุ จุดรับเอกสาร หรือวิธีใช้" />
        {error && <div className="form-alert form-alert-error">{error}</div>}
        {message && <div className="form-alert form-alert-success">{message}</div>}
        <button className="btn btn-primary btn-full" disabled={pending} type="submit">
          {pending ? "กำลังอัปโหลดและผูกกับทริป..." : "+ เพิ่มเอกสารเข้าทริปนี้"}
        </button>
      </form>
    </details>
  );
}
