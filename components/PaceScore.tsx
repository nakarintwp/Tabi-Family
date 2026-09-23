export function PaceScore({
  score,
  label,
  tone,
  distanceKm,
  totalMinutes = 0,
  tips,
}: {
  score: number;
  label: string;
  tone: string;
  distanceKm: number;
  totalMinutes?: number;
  tips: string[];
}) {
  return (
    <div className={`pace-card pace-${tone}`}>
      <div className="pace-score-ring"><strong>{score}</strong><span>/100</span></div>
      <div className="pace-copy">
        <div className="eyebrow">Family Smart Pace</div>
        <h3>{label}</h3>
        <p>{totalMinutes ? `กิจกรรมรวม ~${Math.round(totalMinutes / 60)} ชม.` : "ประเมินจากจำนวนกิจกรรมและโปรไฟล์ครอบครัว"}{distanceKm > 0 ? ` • พิกัด ~${distanceKm.toFixed(1)} กม.` : ""}</p>
        <ul>{tips.slice(0, 2).map((tip) => <li key={tip}>{tip}</li>)}</ul>
      </div>
    </div>
  );
}
