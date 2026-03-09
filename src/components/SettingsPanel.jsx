import { useState } from 'react';
import { X } from 'lucide-react';

export default function SettingsPanel({ open, onClose, systemPrompt, onApply, gpuMode }) {
  const [draft, setDraft] = useState(systemPrompt);

  const modeLabel =
    gpuMode === 'fp16' ? 'fp16 mode' :
    gpuMode === 'compat' ? 'compat mode (fp32/q4)' :
    'unknown';

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 z-40 flex flex-col transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              GPU Mode
            </label>
            <div className="px-3 py-2 rounded bg-gray-800 text-gray-300 text-sm">
              {modeLabel}
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="block text-sm font-medium text-gray-300">
              System Prompt
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              className="w-full bg-gray-800 text-gray-100 text-sm rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
