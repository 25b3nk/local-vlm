import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatThread({ messages, isGenerating }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold text-gray-400">SmolChat</p>
          <p>Powered by SmolVLM-256M-Instruct · Runs entirely on your device</p>
          <p className="text-xs">Send text or attach images to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;
        const isStreamingThis = isLast && msg.role === 'assistant' && isGenerating;
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={isStreamingThis}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
