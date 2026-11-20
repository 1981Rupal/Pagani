import type { BodyShape } from "../_data/types";
import { silhouettePaths } from "../_lib/bodyShape";

/**
 * Side-view line drawing generated from the same surface maths as the 3D body,
 * so the card and the model never disagree. Server-rendered SVG, zero JS.
 */
export function Silhouette({ shape, label }: { shape: BodyShape; label: string }) {
  const p = silhouettePaths(shape, 100, 24);
  return (
    <svg
      viewBox={`0 0 ${p.width.toFixed(0)} ${p.height.toFixed(0)}`}
      className={`pc-sketch block h-auto w-full`}
      role="img"
      aria-label={`Side elevation line drawing of the ${label}`}
    >
      <line x1="0" x2={p.width} y1={p.groundY} y2={p.groundY} className="pc-ground" />
      <path d={p.body} pathLength={1} className="pc-line" />
      {p.screen && <path d={p.screen} pathLength={1} className="pc-line" />}
      {p.wheels.map((w, i) => (
        <g key={i}>
          <circle cx={w.cx} cy={w.cy} r={w.r + 6} className="pc-arch" />
          <circle cx={w.cx} cy={w.cy} r={w.r} pathLength={1} className="pc-line" />
          <circle cx={w.cx} cy={w.cy} r={w.r * 0.72} pathLength={1} className="pc-line-fine" />
        </g>
      ))}
    </svg>
  );
}
