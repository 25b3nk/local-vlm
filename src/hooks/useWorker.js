import { useEffect, useRef, useCallback } from 'react';

export function useWorker(onMessage) {
  const workerRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/vlmWorker.js', import.meta.url),
      { type: 'module' }
    );

    worker.addEventListener('message', (e) => {
      onMessageRef.current(e.data);
    });

    worker.addEventListener('error', (e) => {
      onMessageRef.current({ type: 'error', message: e.message ?? 'Worker crashed' });
    });

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  const postMessage = useCallback((msg) => {
    workerRef.current?.postMessage(msg);
  }, []);

  return { postMessage };
}
