import React, { useState } from 'react';
import { X, Github, Check, Copy, Terminal, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [repoName, setRepoName] = useState('precalculus-v2-v3');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const resolvedUser = username.trim() || 'YOUR_GITHUB_USERNAME';
  const resolvedRepo = repoName.trim() || 'precalculus-v2-v3';

  const gitCommands = [
    `# 1. Create a new public repository "${resolvedRepo}" on https://github.com/new`,
    `git remote add origin https://github.com/${resolvedUser}/${resolvedRepo}.git`,
    `git branch -M main`,
    `git push -u origin main`,
  ];

  const copyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllCommands = () => {
    const fullScript = [
      `git remote remove origin 2>/dev/null || true`,
      `git remote add origin https://github.com/${resolvedUser}/${resolvedRepo}.git`,
      `git branch -M main`,
      `git push -u origin main`,
    ].join(' && ');
    navigator.clipboard.writeText(fullScript);
    setCopiedIndex(99);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0d101a] p-6 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Upload & Sync to GitHub
              </h3>
              <p className="text-[11px] text-slate-400">
                Publish your unified Precalculus v2 & v3 codebase to your GitHub repository
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 space-y-4 text-xs text-slate-300">
          {/* Method 1: AI Studio Built-in 1-Click Export */}
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20">
            <div className="flex items-center gap-2 font-bold text-indigo-300 text-sm mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Option 1: Google AI Studio 1-Click Export (Recommended)</span>
            </div>
            <p className="text-slate-300 leading-relaxed mb-2">
              Google AI Studio provides a native export integration to GitHub directly from your session:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
              <li>Click the <strong>Settings</strong> or <strong>Export</strong> menu in the upper corner of AI Studio.</li>
              <li>Select <strong>Export to GitHub</strong> (or <strong>Download ZIP</strong>).</li>
              <li>Authorize your GitHub account and choose your repository name. AI Studio will commit and push all code automatically!</li>
            </ol>
          </div>

          {/* Interactive Repo Name Generator */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-sm mb-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Option 2: Git Command Line</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  GitHub Username:
                </label>
                <input
                  type="text"
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Repository Name:
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="rounded-lg bg-black/60 border border-slate-800 p-3 font-mono text-[11px] text-slate-300 space-y-2">
              {gitCommands.map((cmd, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <span className={cmd.startsWith('#') ? 'text-slate-500' : 'text-emerald-400 font-mono'}>
                    {cmd}
                  </span>
                  {!cmd.startsWith('#') && (
                    <button
                      onClick={() => copyCommand(cmd, idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                      title="Copy command"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                Or run the helper script: <code className="text-indigo-400">bash scripts/push-to-github.sh {resolvedUser} {resolvedRepo}</code>
              </span>
              <button
                onClick={copyAllCommands}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all active:scale-95"
              >
                {copiedIndex === 99 ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied All!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy 1-Liner</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
