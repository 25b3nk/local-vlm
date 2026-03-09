import { useState, useCallback, useRef } from 'react';

const MAX_TURNS_WITH_IMAGES = 6;
const MAX_TURNS_TEXT_ONLY = 12;

export function useChat(postMessage, systemPrompt) {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const systemPromptRef = useRef(systemPrompt);
  // Keep a synchronous mirror of messages so sendMessage can read
  // the latest state without being inside a setState updater.
  const messagesRef = useRef([]);
  systemPromptRef.current = systemPrompt;

  const appendToken = useCallback((token) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        const next = [
          ...prev.slice(0, -1),
          { ...last, content: last.content + token },
        ];
        // Keep the ref in sync so the next sendMessage reads filled content,
        // not the original empty assistant placeholder.
        messagesRef.current = next;
        return next;
      }
      return prev;
    });
  }, []);

  // Returns { contextMessages, allImages } where allImages is all images
  // from every included turn in order (so the processor gets the right count).
  const buildContextMessages = useCallback((history) => {
    const hasImages = history.some((m) => m.images?.length > 0);
    const maxTurns = hasImages ? MAX_TURNS_WITH_IMAGES : MAX_TURNS_TEXT_ONLY;

    // Each turn = 1 user + 1 assistant message pair
    const userAssistantPairs = [];
    for (let i = 0; i < history.length; i += 2) {
      userAssistantPairs.push(history.slice(i, i + 2));
    }
    const trimmed = userAssistantPairs.slice(-maxTurns).flat();

    // The SmolVLM chat template iterates `message.content` with a for-loop,
    // so every role's content must be an array of content-part objects.
    const contextMessages = [
      { role: 'system', content: [{ type: 'text', text: systemPromptRef.current }] },
    ];
    const allImages = [];

    for (const msg of trimmed) {
      if (msg.role === 'user') {
        const contentParts = [];
        if (msg.images?.length) {
          for (const imgUrl of msg.images) {
            contentParts.push({ type: 'image' });
            allImages.push(imgUrl);
          }
        }
        contentParts.push({ type: 'text', text: msg.content });
        contextMessages.push({ role: 'user', content: contentParts });
      } else {
        contextMessages.push({ role: 'assistant', content: [{ type: 'text', text: msg.content }] });
      }
    }

    return { contextMessages, allImages };
  }, []);

  const sendMessage = useCallback(
    (text, imageDataURLs) => {
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: text,
        images: imageDataURLs ?? [],
      };
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
      };

      // Build context synchronously from the ref — no setState side-effects.
      const history = [...messagesRef.current, userMsg];
      const { contextMessages, allImages } = buildContextMessages(history);

      // Update state and ref together.
      const next = [...messagesRef.current, userMsg, assistantMsg];
      messagesRef.current = next;
      setMessages(next);

      setIsGenerating(true);
      postMessage({
        type: 'generate',
        messages: contextMessages,
        images: allImages,
      });
    },
    [postMessage, buildContextMessages]
  );

  const clearMessages = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
  }, []);

  return {
    messages,
    isGenerating,
    setIsGenerating,
    sendMessage,
    appendToken,
    clearMessages,
  };
}
