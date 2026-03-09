import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ breaks: true });

export default function MessageBubble({ message, isStreaming }) {
  const { role, content, images } = message;
  const isUser = role === 'user';

  const html = !isUser
    ? DOMPurify.sanitize(marked.parse(content))
    : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}
      >
        {/* Image thumbnails for user messages */}
        {isUser && images?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="h-20 w-20 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Text content */}
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{content}</p>
        ) : (
          <div className="text-sm prose prose-invert prose-sm max-w-none">
            {content || isStreaming ? (
              <div
                dangerouslySetInnerHTML={{ __html: html ?? '' }}
                className="inline"
              />
            ) : null}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-gray-300 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        )}

        {/* Model badge */}
        {!isUser && (
          <div className="mt-2 text-xs text-gray-500">SmolVLM-256M</div>
        )}
      </div>
    </div>
  );
}
