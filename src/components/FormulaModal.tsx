import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaModal: React.FC<FormulaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700/80 bg-[#0d101a] p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 sticky top-0 bg-[#0d101a] z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Precalculus MAT201 Master Formula Reference
              </h3>
              <p className="text-xs text-slate-400 font-medium">Curriculum Modules 5 through 9</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 space-y-6 text-xs text-slate-300">
          {/* Module 5 */}
          <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-950/20">
            <h4 className="text-sm font-black text-blue-300 mb-2.5 flex items-center gap-2">
              <span>📐</span>
              <span>Module 5: Polynomial & Power Functions</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-blue-500/10">
                <span className="font-bold text-slate-200 block mb-1">Parabola Vertex Formula:</span>
                <code className="text-blue-300 font-mono block">h = -b / (2a),  k = f(h)</code>
                <p className="text-[11px] text-slate-400 mt-1">If a &lt; 0, vertex is maximum; if a &gt; 0, vertex is minimum.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-blue-500/10">
                <span className="font-bold text-slate-200 block mb-1">Leading Term Test (End Behavior):</span>
                <code className="text-blue-300 font-mono block">y = an · xⁿ as x ➔ ±∞</code>
                <p className="text-[11px] text-slate-400 mt-1">Odd degree: opposite directions; Even degree: same direction.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-blue-500/10">
                <span className="font-bold text-slate-200 block mb-1">Synthetic Division & Remainder:</span>
                <code className="text-blue-300 font-mono block">P(x) = (x - c)·Q(x) + R, where R = P(c)</code>
                <p className="text-[11px] text-slate-400 mt-1">If R = 0, (x - c) is a factor of P(x).</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-blue-500/10">
                <span className="font-bold text-slate-200 block mb-1">Rational Zero Theorem:</span>
                <code className="text-blue-300 font-mono block">Possible rational zeros = ±(factors of a₀) / (factors of an)</code>
              </div>
            </div>
          </div>

          {/* Module 6 */}
          <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
            <h4 className="text-sm font-black text-cyan-300 mb-2.5 flex items-center gap-2">
              <span>⚡</span>
              <span>Module 6: Rational & Radical Functions</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/10">
                <span className="font-bold text-slate-200 block mb-1">Vertical Asymptotes vs. Holes:</span>
                <code className="text-cyan-300 font-mono block">Denominator factor canceled ➔ Removable Hole</code>
                <code className="text-cyan-300 font-mono block">Denominator factor remains ➔ Vertical Asymptote x = c</code>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/10">
                <span className="font-bold text-slate-200 block mb-1">Horizontal & Slant Asymptotes:</span>
                <p className="text-[11px] text-slate-300">Degree n (num), m (denom):</p>
                <p className="text-[11px] text-slate-400">n &lt; m: y = 0 | n = m: y = an/bm | n = m + 1: Slant y = mx + b (via long division)</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/10">
                <span className="font-bold text-slate-200 block mb-1">Finding Inverse Function:</span>
                <code className="text-cyan-300 font-mono block">1. y = f(x) ➔ 2. Swap x and y ➔ 3. Solve for y = f⁻¹(x)</code>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/10">
                <span className="font-bold text-slate-200 block mb-1">Extraneous Roots:</span>
                <p className="text-[11px] text-slate-400">Always check candidate solutions in original radical arguments (≥ 0) and rational denominators (≠ 0).</p>
              </div>
            </div>
          </div>

          {/* Module 7 */}
          <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20">
            <h4 className="text-sm font-black text-purple-300 mb-2.5 flex items-center gap-2">
              <span>🔄</span>
              <span>Module 7: Transformations & Symmetry</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-purple-500/10">
                <span className="font-bold text-slate-200 block mb-1">Standard Form:</span>
                <code className="text-purple-300 font-mono">y = a · f(b(x - h)) + k</code>
                <p className="text-[11px] text-slate-400 mt-1">h = horiz shift (opposite sign), k = vert shift</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-purple-500/10">
                <span className="font-bold text-slate-200 block mb-1">Point Mapping Rule:</span>
                <code className="text-purple-300 font-mono">(x, y) ➔ ((x / b) + h, a · y + k)</code>
                <p className="text-[11px] text-slate-400 mt-1">Divide x by b, multiply y by a</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-purple-500/10">
                <span className="font-bold text-slate-200 block mb-1">Even Function (y-axis symmetry):</span>
                <code className="text-purple-300 font-mono">f(-x) = f(x)</code>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-purple-500/10">
                <span className="font-bold text-slate-200 block mb-1">Odd Function (origin symmetry):</span>
                <code className="text-purple-300 font-mono">f(-x) = -f(x)</code>
              </div>
            </div>
          </div>

          {/* Module 8 */}
          <div className="p-4 rounded-2xl border border-teal-500/30 bg-teal-950/20">
            <h4 className="text-sm font-black text-teal-300 mb-2.5 flex items-center gap-2">
              <span>📈</span>
              <span>Module 8: Exponential Functions</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-teal-500/10">
                <span className="font-bold text-slate-200 block mb-1">Periodic Compounding:</span>
                <code className="text-teal-300 font-mono">A = P · (1 + r / n)^(n · t)</code>
                <p className="text-[11px] text-slate-400 mt-1">n: annual=1, quarterly=4, monthly=12, daily=365</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-teal-500/10">
                <span className="font-bold text-slate-200 block mb-1">Continuous Compounding:</span>
                <code className="text-teal-300 font-mono">A = P · e^(r · t)</code>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-teal-500/10">
                <span className="font-bold text-slate-200 block mb-1">Half-Life Decay Model:</span>
                <code className="text-teal-300 font-mono">Q(t) = Q₀ · (1/2)^(t / h) = Q₀ · e^(kt)</code>
                <p className="text-[11px] text-slate-400 mt-1">k = -ln(2) / h</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-teal-500/10">
                <span className="font-bold text-slate-200 block mb-1">Exponential Asymptote:</span>
                <code className="text-teal-300 font-mono">y = a · b^(x - h) + k ⟹ HA: y = k</code>
              </div>
            </div>
          </div>

          {/* Module 9 */}
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20">
            <h4 className="text-sm font-black text-amber-300 mb-2.5 flex items-center gap-2">
              <span>🧮</span>
              <span>Module 9: Logarithmic Functions</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/10">
                <span className="font-bold text-slate-200 block mb-1">Inverse Definition:</span>
                <code className="text-amber-300 font-mono">log_b(x) = y  ⟺  b^y = x</code>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/10">
                <span className="font-bold text-slate-200 block mb-1">Change of Base Formula:</span>
                <code className="text-amber-300 font-mono">log_b(a) = ln(a) / ln(b) = log(a) / log(b)</code>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/10">
                <span className="font-bold text-slate-200 block mb-1">Product, Quotient, Power Rules:</span>
                <code className="text-amber-300 font-mono block">log(uv) = log(u) + log(v)</code>
                <code className="text-amber-300 font-mono block">log(u/v) = log(u) - log(v)</code>
                <code className="text-amber-300 font-mono block">log(u^c) = c · log(u)</code>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/10">
                <span className="font-bold text-slate-200 block mb-1">Vertical Asymptote & Domain:</span>
                <code className="text-amber-300 font-mono">f(x) = log_b(x - h) + k ⟹ VA: x = h</code>
                <p className="text-[11px] text-slate-400 mt-1">Domain: x &gt; h (argument &gt; 0)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg"
          >
            Close Formula Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
