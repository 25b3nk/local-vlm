import { useState, useCallback, useRef } from 'react';
import { useWorker } from './hooks/useWorker';
import { useChat } from './hooks/useChat';

import MobileBlock from './components/MobileBlock';
import LoadingScreen from './components/LoadingScreen';
import StatusBar from './components/StatusBar';
import ChatThread from './components/ChatThread';
import InputBar from './components/InputBar';
import SettingsPanel from './components/SettingsPanel';
import ErrorBanner from './components/ErrorBanner';

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';

const isMobile = /Mobi|Android/i.test(navigator.userAgent);
const hasWebGPU = !!navigator.gpu;

export default function App() {
  if (isMobile) return <MobileBlock />;

  if (!hasWebGPU) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold">WebGPU Not Supported</h1>
          <p className="text-gray-300">
            WebGPU is not supported in this browser. Please use Chrome 113+ on desktop.
          </p>
        </div>
      </div>
    );
  }

  return <ChatApp />;
}

function ChatApp() {
  const [status, setStatus] = useState('loading');
  const [gpuMode, setGpuMode] = useState(null);
  const [progress, setProgress] = useState({ file: '', percent: 0 });
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);

  // Use a ref so the worker message handler always sees the latest callbacks
  // without needing to be redeclared (avoids stale-closure issues across renders).
  const chatCallbacksRef = useRef(null);

  const handleWorkerMessage = useCallback((data) => {
    const cbs = chatCallbacksRef.current;
    switch (data.type) {
      case 'progress':
        setProgress({ file: data.file, percent: data.percent });
        break;
      case 'ready':
        setStatus('ready');
        setGpuMode(data.gpuMode);
        break;
      case 'token':
        cbs?.appendToken(data.text);
        break;
      case 'done':
        cbs?.setIsGenerating(false);
        break;
      case 'error':
        setErrorMsg(data.message);
        setStatus((s) => (s === 'loading' ? 'error' : s));
        cbs?.setIsGenerating(false);
        break;
    }
  }, []); // stable — reads through ref

  const { postMessage } = useWorker(handleWorkerMessage);

  const {
    messages,
    isGenerating,
    setIsGenerating,
    sendMessage,
    appendToken,
    clearMessages,
  } = useChat(postMessage, systemPrompt);

  // Keep ref up-to-date every render so handleWorkerMessage is never stale.
  chatCallbacksRef.current = { appendToken, setIsGenerating };

  const handleSend = useCallback(
    (text, images) => {
      if (!text && images.length === 0) return;
      sendMessage(text, images);
      setPendingImages([]);
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col h-dvh bg-gray-950 text-white">
      <StatusBar
        status={status}
        gpuMode={gpuMode}
        isGenerating={isGenerating}
        onSettings={() => setSettingsOpen(true)}
        onClear={clearMessages}
      />

      {status === 'loading' && (
        <LoadingScreen file={progress.file} percent={progress.percent} />
      )}

      {errorMsg && <ErrorBanner message={errorMsg} />}

      <ChatThread messages={messages} isGenerating={isGenerating} />

      <InputBar
        onSend={handleSend}
        disabled={isGenerating || status !== 'ready'}
        pendingImages={pendingImages}
        onImagesChange={setPendingImages}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        systemPrompt={systemPrompt}
        onApply={setSystemPrompt}
        gpuMode={gpuMode}
      />
    </div>
  );
}
