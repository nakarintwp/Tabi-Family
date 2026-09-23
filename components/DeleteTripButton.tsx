"use client";

import { useFormStatus } from "react-dom";

type DeleteAction = (formData: FormData) => void | Promise<void>;

function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-danger delete-trip-button" type="submit" disabled={pending}>
      {pending ? "กำลังลบทริป..." : "ลบทริปนี้"}
    </button>
  );
}

export function DeleteTripButton({
  action,
  tripId,
  tripTitle,
}: {
  action: DeleteAction;
  tripId: string;
  tripTitle: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `ต้องการลบทริป “${tripTitle}” ใช่หรือไม่?\n\nข้อมูลวันเดินทาง กิจกรรม สมาชิก การจอง และค่าใช้จ่ายของทริปนี้จะถูกลบทั้งหมด และไม่สามารถย้อนกลับได้`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="trip_id" value={tripId} />
      <DeleteSubmitButton />
    </form>
  );
}
