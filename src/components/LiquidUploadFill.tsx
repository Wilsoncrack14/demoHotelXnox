import React from 'react';

interface LiquidUploadFillProps {
  progress: number; // 0 to 100
  isComplete?: boolean;
}

export default function LiquidUploadFill({
  progress,
  isComplete = false,
}: LiquidUploadFillProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] z-0">
      {/* Rising liquid column from bottom */}
      <div
        className="absolute inset-x-0 bottom-0 transition-[height] duration-300 ease-out"
        style={{
          height: `${clamped}%`,
          background: isComplete
            ? 'linear-gradient(180deg, rgba(74, 222, 128, 0.36) 0%, rgba(22, 163, 74, 0.52) 100%)'
            : 'linear-gradient(180deg, rgba(236, 72, 153, 0.42) 0%, rgba(147, 51, 234, 0.55) 100%)',
        }}
      >
        {/* Animated SVG wave crest at the top edge of the rising liquid */}
        <div className="absolute -top-3 left-0 w-[200%] h-4 overflow-hidden">
          <svg
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            className="w-full h-full animate-xnox-wave"
          >
            <path
              d="M0,20 C150,40 300,0 450,20 C600,40 750,0 900,20 C1050,40 1125,10 1200,20 L1200,40 L0,40 Z"
              fill={
                isComplete
                  ? 'rgba(74, 222, 128, 0.42)'
                  : 'rgba(236, 72, 153, 0.48)'
              }
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
