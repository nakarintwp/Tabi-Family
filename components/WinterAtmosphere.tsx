export function WinterAtmosphere() {
  return (
    <>
      <div className="japan-winter-backdrop" aria-hidden="true">
        <span className="winter-sun" />
        <span className="winter-mountain winter-mountain-far" />
        <span className="winter-mountain winter-mountain-near" />
      </div>
      <div className="snow-overlay" aria-hidden="true">
        <span className="snow-layer snow-layer-a" />
        <span className="snow-layer snow-layer-b" />
        <span className="snow-layer snow-layer-c" />
      </div>
    </>
  );
}
