import { Settings, Trash2 } from 'lucide-react';

export default function StatusBar({ status, gpuMode, isGenerating, onSettings, onClear }) {
  const dotColor =
    status === 'ready' ? 'bg-green-400' :
    status === 'loading' ? 'bg-yellow-400' :
    'bg-red-500';

  const modeLabel =
    gpuMode === 'fp16' ? 'fp16' :
    gpuMode === 'compat' ? 'compat' :
    null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-white font-bold text-lg">SmolChat</span>
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} title={status} />
        {modeLabel && (
          <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
            {modeLabel === 'fp16' ? 'fp16 mode' : 'compat mode (fp32/q4)'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onClear}
          disabled={isGenerating}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Clear conversation"
        >
          <Trash2 size={18} />
        </button>
        <button
          onClick={onSettings}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
