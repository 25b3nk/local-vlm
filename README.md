# SmolChat

A browser-based AI chat assistant that runs [SmolVLM-256M-Instruct](https://huggingface.co/HuggingFaceTB/SmolVLM-256M-Instruct) entirely on-device via WebGPU. No server, no API keys — inference runs in a Web Worker using [Transformers.js v3](https://github.com/huggingface/transformers.js).

## Requirements

- Chrome 113+ on desktop (WebGPU required)
- ~500 MB free browser cache (model is downloaded once and cached)

## Features

- **Fully on-device** — model weights never leave your browser
- **fp16 / compat mode** — auto-detects `shader-f16` support; falls back to fp32/q4 on Intel iGPUs
- **Vision + text** — attach images to any message for visual Q&A
- **Streaming output** — tokens stream in real-time with a blinking cursor
- **Multi-turn context** — rolling window of 12 turns (text-only) or 6 turns (with images)
- **Settings panel** — editable system prompt, GPU mode indicator
- **Mobile blocked** — graceful full-screen message on mobile browsers

## Stack

| Layer | Library |
|-------|---------|
| UI | React 19 + Tailwind CSS v4 |
| Build | Vite 7 |
| Inference | @huggingface/transformers v3 |
| Icons | lucide-react |
| Markdown | marked + DOMPurify |
| Deploy | Vercel |

## Project Structure

```
src/
  App.jsx                   # Root — mobile/WebGPU gates, wires hooks to UI
  main.jsx
  components/
    ChatThread.jsx           # Scrolling message list
    MessageBubble.jsx        # User (right) and assistant (left) bubbles
    InputBar.jsx             # Textarea, image attach, send button
    ImagePreviewStrip.jsx    # Thumbnail strip with remove buttons
    SettingsPanel.jsx        # Slide-in panel: system prompt + GPU mode
    StatusBar.jsx            # App title, status dot, GPU badge, actions
    LoadingScreen.jsx        # Progress bar during model download
    MobileBlock.jsx          # Full-screen block for mobile UA
    ErrorBanner.jsx          # Inline error + Reload button
  workers/
    vlmWorker.js             # All inference: load, detect GPU, generate
  hooks/
    useWorker.js             # Stable worker ref + message routing
    useChat.js               # Message state, context window, streaming
  utils/
    imageUtils.js            # File → base64 data URL
    gpuDetect.js             # shader-f16 feature check
vercel.json                  # COOP + COEP headers (required for SharedArrayBuffer)
vite.config.js               # ES worker format, optimizeDeps exclude, dev headers
```

## Local Development

```bash
npm install
npm run dev        # http://localhost:5173
```

Open in Chrome 113+. The model downloads (~500 MB) on first visit and is cached in the browser's cache storage. Subsequent loads are instant.

## Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

The `vercel.json` at the project root sets the required cross-origin isolation headers (`COOP: same-origin`, `COEP: require-corp`) on all routes, which are needed for `SharedArrayBuffer` / ONNX WASM threading.

## How It Works

1. On app mount the main thread spawns `vlmWorker.js` as an ES module Web Worker
2. The worker calls `navigator.gpu.requestAdapter()` and checks `features.has('shader-f16')` to pick dtype config
3. `AutoProcessor`, `AutoTokenizer`, and `SmolVLMForConditionalGeneration` are loaded from HuggingFace Hub (cached after first load)
4. On each user message, the main thread sends `{ type: 'generate', messages, images }` to the worker
5. Text-only messages go through the tokenizer directly; messages with images go through the processor
6. `TextStreamer` streams decoded tokens back as `{ type: 'token', text }` messages
7. The main thread appends each token to the last assistant bubble in real-time

## Known Limitations

- First inference after loading can be slow (WebGPU shader JIT compilation)
- SmolVLM-256M is a small model — complex reasoning may be limited
- Requires desktop Chrome; Firefox and Safari do not yet have full WebGPU support
