"use client";

function download(filename: string, text: string, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  const s = String(value ?? "");
  return `"${s.replaceAll('"', '""')}"`;
}

export function ExportTools({ trip }: { trip: any }) {
  const safe = String(trip.title || "trip").replace(/[^a-zA-Z0-9ก-๙_-]+/g, "-").replace(/-+/g, "-");
  const exportJson = () => download(`${safe}-backup.json`, JSON.stringify({ exported_at: new Date().toISOString(), version: "7.0", trip }, null, 2));
  const exportExpenses = () => {
    const rows = [["date","category","amount","currency","note"], ...(trip.expenses || []).map((e:any)=>[e.paid_at,e.category,e.amount,e.currency,e.note])];
    download(`${safe}-expenses.csv`, "\ufeff" + rows.map((r:any[])=>r.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
  };
  const exportItineraryCsv = () => {
    const rows:any[][] = [["date","day","time","type","title","location","duration_minutes","status","notes"]];
    (trip.trip_days || []).forEach((d:any, i:number) => (d.activities || []).forEach((a:any)=>rows.push([d.trip_date,d.title || `Day ${i+1}`,a.start_time || "",a.activity_type,a.title,a.location_name || "",a.duration_minutes || "",a.status || "planned",a.notes || ""])));
    download(`${safe}-itinerary.csv`, "\ufeff" + rows.map((r:any[])=>r.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
  };
  const exportTransport = () => {
    const rows:any[][] = [["mode","origin","destination","departure","arrival","operator","service","seat","booking_reference","notes"]];
    (trip.transport_segments || []).forEach((t:any)=>rows.push([t.mode,t.origin,t.destination,t.departure_time || "",t.arrival_time || "",t.operator || "",t.service_name || "",t.seat || "",t.booking_reference || "",t.notes || ""]));
    download(`${safe}-transport.csv`, "\ufeff" + rows.map((r:any[])=>r.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
  };
  return <div className="export-actions no-print">
    <button className="btn btn-primary" onClick={() => window.print()}>🖨️ พิมพ์ / Save PDF</button>
    <button className="btn btn-secondary" onClick={exportJson}>⬇ JSON Backup</button>
    <button className="btn btn-secondary" onClick={exportItineraryCsv}>⬇ Itinerary CSV</button>
    <button className="btn btn-secondary" onClick={exportTransport}>⬇ Transport CSV</button>
    <button className="btn btn-secondary" onClick={exportExpenses}>⬇ Expense CSV</button>
  </div>;
}
