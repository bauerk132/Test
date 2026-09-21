import React from 'react';

interface FunctionVisualizerProps {
  type?: 'parabola_shift' | 'exp_growth' | 'exp_decay' | 'log_curve' | 'cubic_symm' | 'rational_curve';
  title?: string;
  color?: string;
}

export const FunctionVisualizer: React.FC<FunctionVisualizerProps> = React.memo(({
  type = 'parabola_shift',
  title,
  color = '#8b5cf6',
}) => {
  // 300x180 SVG canvas coordinate mapping
  const width = 320;
  const height = 180;
  const cx = width / 2;
  const cy = height / 2;
  const scale = 14;

  const toSvgX = (x: number) => cx + x * scale;
  const toSvgY = (y: number) => cy - y * scale;

  // Generate paths based on type
  let parentPath = '';
  let transformedPath = '';
  let asymptotePath = '';
  let asymptoteLabel = '';
  let parentLabel = 'Parent f(x)';
  let transformedLabel = 'g(x)';

  if (type === 'parabola_shift') {
    parentLabel = 'f(x) = x²';
    transformedLabel = 'g(x) = x² - 5';
    // parent x^2
    const pPoints: string[] = [];
    for (let x = -4; x <= 4; x += 0.2) {
      const y = x * x;
      pPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
    }
    parentPath = 'M ' + pPoints.join(' L ');

    // transformed x^2 - 5
    const tPoints: string[] = [];
    for (let x = -4.5; x <= 4.5; x += 0.2) {
      const y = x * x - 5;
      tPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
    }
    transformedPath = 'M ' + tPoints.join(' L ');
  } else if (type === 'exp_growth') {
    parentLabel = 'f(x) = 2^x';
    transformedLabel = 'g(x) = 2^(x-1) - 4';
    asymptotePath = `M 0,${toSvgY(-4)} L ${width},${toSvgY(-4)}`;
    asymptoteLabel = 'HA: y = -4';

    const pPoints: string[] = [];
    for (let x = -8; x <= 3.5; x += 0.25) {
      const y = Math.pow(2, x);
      pPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
    }
    parentPath = 'M ' + pPoints.join(' L ');

    const tPoints: string[] = [];
    for (let x = -8; x <= 4.5; x += 0.25) {
      const y = Math.pow(2, x - 1) - 4;
      if (y < 7 && y > -6) {
        tPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
      }
    }
    transformedPath = 'M ' + tPoints.join(' L ');
  } else if (type === 'exp_decay') {
    parentLabel = 'Q(t) = Q₀(1/2)^t';
    transformedLabel = 'Decay Curve';
    asymptotePath = `M 0,${toSvgY(0)} L ${width},${toSvgY(0)}`;
    asymptoteLabel = 'HA: y = 0';

    const tPoints: string[] = [];
    for (let x = 0; x <= 8; x += 0.2) {
      const y = 5 * Math.pow(0.5, x / 2);
      tPoints.push(`${toSvgX(x - 2).toFixed(1)},${toSvgY(y).toFixed(1)}`);
    }
    transformedPath = 'M ' + tPoints.join(' L ');
  } else if (type === 'log_curve') {
    parentLabel = 'f(x) = log₂(x)';
    transformedLabel = 'g(x) = log₂(x - 3) + 1';
    const vaX = toSvgX(3);
    asymptotePath = `M ${vaX},0 L ${vaX},${height}`;
    asymptoteLabel = 'VA: x = 3';

    const tPoints: string[] = [];
    for (let x = 3.05; x <= 9; x += 0.15) {
      const y = Math.log2(x - 3) + 1;
      if (y > -6 && y < 6) {
        tPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
      }
    }
    transformedPath = 'M ' + tPoints.join(' L ');
  } else if (type === 'cubic_symm') {
    parentLabel = 'f(x) = x³ - 4x';
    transformedLabel = 'Odd 180° Rotational Symmetry';

    const tPoints: string[] = [];
    for (let x = -3; x <= 3; x += 0.15) {
      const y = x * x * x - 4 * x;
      if (Math.abs(y) <= 7) {
        tPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
      }
    }
    transformedPath = 'M ' + tPoints.join(' L ');
  } else if (type === 'rational_curve') {
    parentLabel = 'Vertical Asymptote x = 2';
    transformedLabel = 'f(x) = (2x + 1)/(x - 2)';
    asymptotePath = `M ${toSvgX(2)} 0 L ${toSvgX(2)} ${height}`;
    asymptoteLabel = 'VA: x = 2';

    const leftBranch: string[] = [];
    for (let x = -8; x < 1.8; x += 0.2) {
      const y = (2 * x + 1) / (x - 2);
      if (Math.abs(y) <= 8) {
        leftBranch.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
      }
    }
    const rightBranch: string[] = [];
    for (let x = 2.2; x <= 8; x += 0.2) {
      const y = (2 * x + 1) / (x - 2);
      if (Math.abs(y) <= 8) {
        rightBranch.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
      }
    }
    transformedPath = (leftBranch.length > 0 ? 'M ' + leftBranch.join(' L ') : '') +
      (rightBranch.length > 0 ? ' M ' + rightBranch.join(' L ') : '');
  }

  return (
    <div className="my-3 rounded-xl border border-slate-800 bg-[#0d1017] p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
          {title || 'Graph Preview'}
        </span>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {parentPath && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-slate-500 inline-block"></span>
              {parentLabel}
            </span>
          )}
          <span className="flex items-center gap-1" style={{ color }}>
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: color }}></span>
            {transformedLabel}
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg bg-[#07090e] border border-slate-900">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 select-none">
          <defs>
            <pattern id="grid" width={scale * 2} height={scale * 2} patternUnits="userSpaceOnUse">
              <path
                d={`M ${scale * 2} 0 L 0 0 0 ${scale * 2}`}
                fill="none"
                stroke="#1e2433"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect width={width} height={height} fill="url(#grid)" />

          {/* Coordinate Axes */}
          <line x1="0" y1={cy} x2={width} y2={cy} stroke="#334155" strokeWidth="1" />
          <line x1={cx} y1="0" x2={cx} y2={height} stroke="#334155" strokeWidth="1" />

          {/* Axis Labels */}
          <text x={width - 14} y={cy - 4} fill="#64748b" fontSize="10">x</text>
          <text x={cx + 5} y={12} fill="#64748b" fontSize="10">y</text>

          {/* Asymptote */}
          {asymptotePath && (
            <>
              <path
                d={asymptotePath}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />
              <text
                x={type === 'log_curve' ? toSvgX(3) + 4 : width - 65}
                y={type === 'log_curve' ? 24 : toSvgY(-4) - 4}
                fill="#f59e0b"
                fontSize="9"
                fontWeight="bold"
              >
                {asymptoteLabel}
              </text>
            </>
          )}

          {/* Parent Function */}
          {parentPath && (
            <path
              d={parentPath}
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
          )}

          {/* Transformed Function */}
          {transformedPath && (
            <path
              d={transformedPath}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
});
