export function PaceScore({ score, label, tone, distanceKm, tips }: { score: number; label: string; tone: string; distanceKm: number; tips: string[] }) {
  return (
    <div className={`pace-card pace-${tone}`}>
      <div className="pace-score-ring"><strong>{score}</strong><span>/100</span></div>
      <div className="pace-copy">
        <div className="eyebrow">Family Pace Score</div>
        <h3>{label}</h3>
        <p>ระยะทางระหว่างจุดประมาณ {distanceKm.toFixed(1)} กม. (ประมาณการจากพิกัด)</p>
        <ul>{tips.slice(0, 2).map((tip) => <li key={tip}>{tip}</li>)}</ul>
      </div>
    </div>
  );
}
