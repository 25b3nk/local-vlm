import { useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import ImagePreviewStrip from './ImagePreviewStrip';
import { filesToBase64DataURLs } from '../utils/imageUtils';

export default function InputBar({ onSend, disabled, pendingImages, onImagesChange }) {
  const [text, setText] = useState('');
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const tooManyImages = pendingImages.length > 4;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (disabled || (!text.trim() && pendingImages.length === 0)) return;
    onSend(text.trim(), pendingImages);
    setText('');
    onImagesChange([]);
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newUrls = await filesToBase64DataURLs(files);
    onImagesChange([...pendingImages, ...newUrls]);
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    onImagesChange(pendingImages.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-gray-700 bg-gray-900 shrink-0">
      <ImagePreviewStrip images={pendingImages} onRemove={handleRemoveImage} />

      {tooManyImages && (
        <div className="px-4 py-1 text-xs text-yellow-400">
          Warning: more than 4 images attached. This may affect model performance.
        </div>
      )}

      <div className="flex items-end gap-2 px-4 py-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shrink-0"
          title="Attach image"
          disabled={disabled}
        >
          <Paperclip size={20} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Message SmolChat…"
          rows={1}
          className="flex-1 resize-none bg-gray-800 text-gray-100 text-sm rounded-xl px-4 py-2.5 border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500 disabled:opacity-50 max-h-40 overflow-y-auto"
          style={{ fieldSizing: 'content' }}
        />

        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && pendingImages.length === 0)}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          title="Send"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
