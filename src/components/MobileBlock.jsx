export default function MobileBlock() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white p-8 z-50">
      <div className="max-w-md text-center space-y-4">
        <div className="text-6xl">🖥️</div>
        <h1 className="text-2xl font-bold">Desktop Only</h1>
        <p className="text-gray-300">
          This app requires a desktop browser with WebGPU support (Chrome 113+).
        </p>
      </div>
    </div>
  );
}
