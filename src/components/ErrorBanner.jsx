import { AlertCircle } from 'lucide-react';

export default function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-red-900/60 border border-red-700 text-red-200 text-sm">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={() => window.location.reload()}
        className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-medium transition-colors"
      >
        Reload
      </button>
    </div>
  );
}
