import { redirect } from "next/navigation";

export default async function LegacyCommandCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/today?trip=${id}`);
}
