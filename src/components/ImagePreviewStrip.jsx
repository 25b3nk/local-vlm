import { X } from 'lucide-react';

export default function ImagePreviewStrip({ images, onRemove }) {
  if (!images.length) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-gray-700">
      {images.map((src, i) => (
        <div key={i} className="relative group">
          <img
            src={src}
            alt=""
            className="h-16 w-16 object-cover rounded-lg border border-gray-600"
          />
          <button
            onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 bg-gray-900 border border-gray-600 rounded-full p-0.5 text-gray-300 hover:text-white hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
