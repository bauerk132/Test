import React, { useState } from 'react';
import { X, RotateCcw, Sliders } from 'lucide-react';

interface InteractiveSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveSandboxModal: React.FC<InteractiveSandboxModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [parentType, setParentType] = useState<'quadratic' | 'absolute' | 'exponential' | 'logarithmic'>('quadratic');
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(1);
  const [h, setH] = useState<number>(0);
  const [k, setK] = useState<number>(0);

  if (!isOpen) return null;

  const resetParams = () => {
    setA(1);
    setB(1);
    setH(0);
    setK(0);
  };

  // Canvas mapping
  const width = 440;
  const height = 280;
  const cx = width / 2;
  const cy = height / 2;
  const scale = 18;

  const toSvgX = (xVal: number) => cx + xVal * scale;
  const toSvgY = (yVal: number) => cy - yVal * scale;

  // Calculate transformed curve
  const points: string[] = [];
  const parentPoints: string[] = [];
  let asymptotePath = '';
  let asymptoteLabel = '';

  if (parentType === 'quadratic') {
    // Parent x^2
    for (let x = -6; x <= 6; x += 0.2) {
      parentPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(x * x).toFixed(1)}`);
    }
    // Transformed: a * (b*(x - h))^2 + k
    for (let x = -8; x <= 8; x += 0.15) {
      const u = b * (x - h);
      const y = a * (u * u) + k;
      if (y > -15 && y < 15) {
        points.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
      }
    }
  } else if (parentType === 'absolute') {
    for (let x = -6; x <= 6; x += 0.2) {
      parentPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(Math.abs(x)).toFixed(1)}`);
    }
    for (let x = -8; x <= 8; x += 0.15) {
      const u = b * (x - h);
      const y = a * Math.abs(u) + k;
      if (y > -15 && y < 15) {
        points.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
      }
    }
  } else if (parentType === 'exponential') {
    // Parent 2^x
    for (let x = -7; x <= 4; x += 0.2) {
      parentPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(Math.pow(2, x)).toFixed(1)}`);
    }
    // Asymptote is y = k
    const haY = toSvgY(k);
    asymptotePath = `M 0,${haY} L ${width},${haY}`;
    asymptoteLabel = `HA: y = ${k}`;

    for (let x = -10; x <= 10; x += 0.15) {
      const u = b * (x - h);
      if (u <= 8) {
        const y = a * Math.pow(2, u) + k;
        if (y > -15 && y < 15) {
          points.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
        }
      }
    }
  } else if (parentType === 'logarithmic') {
    // Parent log2(x)
    for (let x = 0.1; x <= 8; x += 0.15) {
      parentPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(Math.log2(x)).toFixed(1)}`);
    }
    // VA is x = h
    const vaX = toSvgX(h);
    asymptotePath = `M ${vaX},0 L ${vaX},${height}`;
    asymptoteLabel = `VA: x = ${h}`;

    for (let x = -10; x <= 10; x += 0.1) {
      const u = b * (x - h);
      if (u > 0.05) {
        const y = a * Math.log2(u) + k;
        if (y > -15 && y < 15) {
          points.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
        }
      }
    }
  }

  const formulaString = () => {
    const aStr = a === 1 ? '' : a === -1 ? '-' : `${a}·`;
    const bStr = b === 1 ? '' : `${b}`;
    const hStr = h === 0 ? 'x' : h > 0 ? `(x - ${h})` : `(x + ${Math.abs(h)})`;
    const kStr = k === 0 ? '' : k > 0 ? ` + ${k}` : ` - ${Math.abs(k)}`;

    if (parentType === 'quadratic') return `g(x) = ${aStr}[${bStr}${hStr}]²${kStr}`;
    if (parentType === 'absolute') return `g(x) = ${aStr}|${bStr}${hStr}|${kStr}`;
    if (parentType === 'exponential') return `g(x) = ${aStr}2^[${bStr}${hStr}]${kStr}`;
    if (parentType === 'logarithmic') return `g(x) = ${aStr}log₂[${bStr}${hStr}]${kStr}`;
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0d101a] p-6 shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Interactive Function Transformation Sandbox
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Function Type Selector */}
        <div className="my-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Parent:
          </span>
          <button
            onClick={() => setParentType('quadratic')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              parentType === 'quadratic'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            f(x) = x²
          </button>
          <button
            onClick={() => setParentType('absolute')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              parentType === 'absolute'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            f(x) = |x|
          </button>
          <button
            onClick={() => setParentType('exponential')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              parentType === 'exponential'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            f(x) = 2^x
          </button>
          <button
            onClick={() => setParentType('logarithmic')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              parentType === 'logarithmic'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            f(x) = log₂(x)
          </button>
        </div>

        {/* Equation Badge */}
        <div className="mb-4 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="font-mono text-xs sm:text-sm font-bold text-cyan-300">
            {formulaString()}
          </span>
          <button
            onClick={resetParams}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Sliders</span>
          </button>
        </div>

        {/* SVG Canvas */}
        <div className="rounded-xl border border-slate-800 bg-[#07090e] p-2 flex justify-center mb-4 overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 sm:h-56 select-none">
            {/* Grid & Axes */}
            <line x1="0" y1={cy} x2={width} y2={cy} stroke="#334155" strokeWidth="1" />
            <line x1={cx} y1="0" x2={cx} y2={height} stroke="#334155" strokeWidth="1" />

            {/* Asymptote */}
            {asymptotePath && (
              <>
                <path d={asymptotePath} stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4,4" />
                <text x={20} y={24} fill="#f59e0b" fontSize="10" fontWeight="bold">
                  {asymptoteLabel}
                </text>
              </>
            )}

            {/* Parent curve (dashed) */}
            {parentPoints.length > 0 && (
              <path
                d={'M ' + parentPoints.join(' L ')}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
            )}

            {/* Transformed curve (solid cyan) */}
            {points.length > 0 && (
              <path
                d={'M ' + points.join(' L ')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>

        {/* 4 Parameter Sliders: a, b, h, k */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between mb-1 font-semibold text-slate-300">
              <span>a (Vert Stretch):</span>
              <span className="font-mono text-cyan-400">{a}</span>
            </div>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.5"
              value={a}
              onChange={(e) => setA(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between mb-1 font-semibold text-slate-300">
              <span>b (Horiz Scale):</span>
              <span className="font-mono text-cyan-400">{b}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={b}
              onChange={(e) => setB(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between mb-1 font-semibold text-slate-300">
              <span>h (Horiz Shift):</span>
              <span className="font-mono text-cyan-400">{h}</span>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="1"
              value={h}
              onChange={(e) => setH(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between mb-1 font-semibold text-slate-300">
              <span>k (Vert Shift):</span>
              <span className="font-mono text-cyan-400">{k}</span>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="1"
              value={k}
              onChange={(e) => setK(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
