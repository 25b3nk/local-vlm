export default function LoadingScreen({ file, percent }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-40 p-8">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">SmolChat</h1>
        <p className="text-center text-gray-400">Loading SmolVLM-256M-Instruct…</p>

        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-200"
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-400">
          <span className="truncate max-w-[75%]">{file || 'Initializing…'}</span>
          <span>{Math.round(percent)}%</span>
        </div>

        <p className="text-xs text-center text-gray-500">
          First load downloads ~500 MB and caches it in your browser.
        </p>
      </div>
    </div>
  );
}
