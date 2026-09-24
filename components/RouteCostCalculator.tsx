"use client";

import { useMemo, useState } from "react";

function money(value: number) { return `¥${Math.max(0, Math.round(value)).toLocaleString("en-US")}`; }

export function RouteCostCalculator({ initialPartySize = 4 }: { initialPartySize?: number }) {
  const [party, setParty] = useState(Math.max(1, initialPartySize));
  const [trainPerPerson, setTrainPerPerson] = useState(0);
  const [busPerPerson, setBusPerPerson] = useState(0);
  const [taxiTotal, setTaxiTotal] = useState(0);
  const [carRental, setCarRental] = useState(0);
  const [toll, setToll] = useState(0);
  const [fuel, setFuel] = useState(0);
  const [parking, setParking] = useState(0);
  const [otherCar, setOtherCar] = useState(0);

  const rows = useMemo(() => [
    { label: "Train", total: trainPerPerson * party, note: `${money(trainPerPerson)} × ${party} คน` },
    { label: "Bus", total: busPerPerson * party, note: `${money(busPerPerson)} × ${party} คน` },
    { label: "Taxi", total: taxiTotal, note: "ยอดรวมที่กรอก" },
    { label: "Rental car", total: carRental + toll + fuel + parking + otherCar, note: `รถ ${money(carRental)} + Toll ${money(toll)} + Fuel ${money(fuel)} + Parking ${money(parking)}` },
  ], [party, trainPerPerson, busPerPerson, taxiTotal, carRental, toll, fuel, parking, otherCar]);

  const positive = rows.filter((r) => r.total > 0);
  const lowest = positive.length ? Math.min(...positive.map((r) => r.total)) : null;

  return <div className="route-cost-tool">
    <div className="notice"><span>🧮</span><div><strong>กรอกค่าใช้จ่ายที่คุณเช็กจริง</strong><p>ระบบไม่ดึงราคาสด จึงไม่เสี่ยงแสดงค่าโดยสารเก่า เปรียบเทียบจากตัวเลขที่คุณกรอกเอง</p></div></div>
    <div className="grid2 route-cost-inputs">
      <label className="field"><span>จำนวนคน</span><input className="input" type="number" min="1" value={party} onChange={(e)=>setParty(Math.max(1, Number(e.target.value)||1))}/></label>
      <label className="field"><span>Train / คน (JPY)</span><input className="input" type="number" min="0" value={trainPerPerson || ""} onChange={(e)=>setTrainPerPerson(Number(e.target.value)||0)}/></label>
      <label className="field"><span>Bus / คน (JPY)</span><input className="input" type="number" min="0" value={busPerPerson || ""} onChange={(e)=>setBusPerPerson(Number(e.target.value)||0)}/></label>
      <label className="field"><span>Taxi รวม (JPY)</span><input className="input" type="number" min="0" value={taxiTotal || ""} onChange={(e)=>setTaxiTotal(Number(e.target.value)||0)}/></label>
      <label className="field"><span>ค่าเช่ารถ</span><input className="input" type="number" min="0" value={carRental || ""} onChange={(e)=>setCarRental(Number(e.target.value)||0)}/></label>
      <label className="field"><span>ทางด่วน / ETC</span><input className="input" type="number" min="0" value={toll || ""} onChange={(e)=>setToll(Number(e.target.value)||0)}/></label>
      <label className="field"><span>น้ำมัน</span><input className="input" type="number" min="0" value={fuel || ""} onChange={(e)=>setFuel(Number(e.target.value)||0)}/></label>
      <label className="field"><span>ที่จอดรถ</span><input className="input" type="number" min="0" value={parking || ""} onChange={(e)=>setParking(Number(e.target.value)||0)}/></label>
      <label className="field"><span>ค่าใช้จ่ายรถอื่น ๆ</span><input className="input" type="number" min="0" value={otherCar || ""} onChange={(e)=>setOtherCar(Number(e.target.value)||0)}/></label>
    </div>
    <div className="route-cost-results">{rows.map((row)=><article className={`route-cost-result ${lowest != null && row.total === lowest ? "lowest" : ""}`} key={row.label}><span>{row.label}</span><strong>{money(row.total)}</strong><small>{row.note}</small>{lowest != null && row.total === lowest && <em>ค่าใช้จ่ายต่ำสุดจากตัวเลขที่กรอก</em>}</article>)}</div>
  </div>;
}
