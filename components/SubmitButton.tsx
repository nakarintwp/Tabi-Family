"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
};

export function SubmitButton({ children, pendingText = "กำลังบันทึก...", className = "btn btn-primary", disabled = false }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending || disabled} aria-disabled={pending || disabled}>
      {pending ? <><span className="button-spinner" aria-hidden="true" />{pendingText}</> : children}
    </button>
  );
}
