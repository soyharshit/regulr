"use client";

import { useCallback, useState } from "react";
import confetti from "canvas-confetti";

interface SpinWheelProps {
  orderId: string;
  cafeId: string;
  onClaimed: (bonus: number) => void;
}

const SEGMENTS = [
  { label: "+5", points: 5, color: "#FF6B4A", weight: 5 },
  { label: "+10", points: 10, color: "#FFB020", weight: 5 },
  { label: "+15", points: 15, color: "#6C5CE7", weight: 4 },
  { label: "+20", points: 20, color: "#00C875", weight: 4 },
  { label: "+25", points: 25, color: "#00C4A7", weight: 3 },
  { label: "+30", points: 30, color: "#E2445C", weight: 2 },
  { label: "+50", points: 50, color: "#FFB020", weight: 1 },
  { label: "+100", points: 100, color: "#6C5CE7", weight: 1 },
];

const TOTAL_WEIGHT = SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
const SEGMENT_ANGLE = 360 / SEGMENTS.length;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function SpinWheel({ orderId, cafeId: _cafeId, onClaimed }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [claimed, setClaimed] = useState(false);

  const spin = useCallback(async () => {
    if (spinning || claimed) return;
    setSpinning(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/scratch`, { method: "POST" });
      if (!res.ok) {
        setSpinning(false);
        return;
      }
      const data = await res.json();
      const bonus: number = data.bonus;

      // Find which segment index matches this bonus
      const segIdx = SEGMENTS.findIndex((s) => s.points === bonus);
      const targetAngle = segIdx >= 0 ? segIdx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 : 0;

      // Calculate rotation: spin 5+ full rotations + land on target
      const fullSpins = 5 * 360;
      const finalAngle = targetAngle;
      const totalRotation = fullSpins + finalAngle - (rotation % 360);

      setRotation((prev) => prev + totalRotation);

      setTimeout(() => {
        setSpinning(false);
        setClaimed(true);
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
        onClaimed(bonus);
      }, 3500);
    } catch {
      setSpinning(false);
    }
  }, [spinning, claimed, orderId, rotation, onClaimed]);

  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  let cumAngle = 0;
  const arcs = SEGMENTS.map((seg) => {
    const startAngle = cumAngle;
    const sweep = (seg.weight / TOTAL_WEIGHT) * 360;
    cumAngle += sweep;
    const midAngle = startAngle + sweep / 2;
    const labelPos = polarToCartesian(cx, cy, r * 0.65, midAngle);
    return { ...seg, startAngle, sweep, midAngle, labelPos, path: describeArc(cx, cy, r, startAngle, startAngle + sweep) };
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <svg width="24" height="28" viewBox="0 0 24 28">
            <polygon points="12,28 0,0 24,0" fill="#1a1a1a" />
            <polygon points="12,24 3,0 21,0" fill="#333" />
          </svg>
        </div>

        {/* Wheel */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transition-transform duration-[3500ms]"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionTimingFunction: "cubic-bezier(0.17, 0.67, 0.12, 0.99)",
          }}
        >
          {arcs.map((arc, i) => (
            <g key={i}>
              <path d={arc.path} fill={arc.color} stroke="white" strokeWidth="2" />
              <text
                x={arc.labelPos.x}
                y={arc.labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize="14"
                fontWeight="bold"
                fontFamily="Inter, sans-serif"
                style={{
                  transform: `rotate(${arc.midAngle}deg)`,
                  transformOrigin: `${arc.labelPos.x}px ${arc.labelPos.y}px`,
                }}
              >
                {arc.label}
              </text>
            </g>
          ))}
          {/* Center circle */}
          <circle cx={cx} cy={cy} r="28" fill="white" stroke="#e5e5e5" strokeWidth="2" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#1a1a1a" fontSize="11" fontWeight="bold" fontFamily="Inter, sans-serif">
            {claimed ? "Done" : "SPIN"}
          </text>
        </svg>
      </div>

      {!claimed && (
        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="px-8 py-3 rounded-control gradient-coral text-white font-bold text-sm press-scale disabled:opacity-60 disabled:cursor-not-allowed"
          data-testid="spin-wheel-btn"
        >
          {spinning ? "Spinning..." : "Spin the wheel"}
        </button>
      )}
    </div>
  );
}
