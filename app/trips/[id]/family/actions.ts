"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/supabase/auth";

async function requireUser() {
  const { supabase } = await requireVerifiedUser("/trips");
  return supabase;
}

function csv(value: FormDataEntryValue | null) {
  return String(value || "").split(",").map((v) => v.trim()).filter(Boolean);
}

function refresh(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/family`);
}

export async function createMember(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!tripId || !name) return;

  const ageRaw = Number(formData.get("age") || 0);
  await supabase.from("trip_members").insert({
    trip_id: tripId,
    name,
    member_type: String(formData.get("member_type") || "adult"),
    age: Number.isFinite(ageRaw) && ageRaw > 0 ? ageRaw : null,
    walking_level: Math.min(5, Math.max(1, Number(formData.get("walking_level") || 3))),
    needs: csv(formData.get("needs")),
    dietary_preferences: csv(formData.get("dietary_preferences")),
    interests: csv(formData.get("interests")),
    mobility_notes: String(formData.get("mobility_notes") || "").trim() || null,
    avoid_stairs: formData.get("avoid_stairs") === "on",
    needs_frequent_rest: formData.get("needs_frequent_rest") === "on",
    stroller: formData.get("stroller") === "on",
    passport_expiry: String(formData.get("passport_expiry") || "").trim() || null,
    seat_preference: String(formData.get("seat_preference") || "").trim() || null,
    rail_pass: String(formData.get("rail_pass") || "").trim() || null,
    child_seat: formData.get("child_seat") === "on",
    booster_seat: formData.get("booster_seat") === "on",
    emergency_contact: String(formData.get("emergency_contact") || "").trim() || null,
    document_note: String(formData.get("document_note") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });
  refresh(tripId);
}

export async function updateMember(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const memberId = String(formData.get("member_id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!tripId || !memberId || !name) return;

  const ageRaw = Number(formData.get("age") || 0);
  await supabase.from("trip_members").update({
    name,
    member_type: String(formData.get("member_type") || "adult"),
    age: Number.isFinite(ageRaw) && ageRaw > 0 ? ageRaw : null,
    walking_level: Math.min(5, Math.max(1, Number(formData.get("walking_level") || 3))),
    needs: csv(formData.get("needs")),
    dietary_preferences: csv(formData.get("dietary_preferences")),
    interests: csv(formData.get("interests")),
    mobility_notes: String(formData.get("mobility_notes") || "").trim() || null,
    avoid_stairs: formData.get("avoid_stairs") === "on",
    needs_frequent_rest: formData.get("needs_frequent_rest") === "on",
    stroller: formData.get("stroller") === "on",
    passport_expiry: String(formData.get("passport_expiry") || "").trim() || null,
    seat_preference: String(formData.get("seat_preference") || "").trim() || null,
    rail_pass: String(formData.get("rail_pass") || "").trim() || null,
    child_seat: formData.get("child_seat") === "on",
    booster_seat: formData.get("booster_seat") === "on",
    emergency_contact: String(formData.get("emergency_contact") || "").trim() || null,
    document_note: String(formData.get("document_note") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  }).eq("id", memberId).eq("trip_id", tripId);
  refresh(tripId);
}

export async function deleteMember(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const memberId = String(formData.get("member_id") || "");
  if (!tripId || !memberId) return;
  await supabase.from("trip_members").delete().eq("id", memberId).eq("trip_id", tripId);
  refresh(tripId);
}
