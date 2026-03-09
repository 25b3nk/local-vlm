# SmolChat — Claude Code Guide

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

## Architecture

Single-page app. All inference runs in **one Web Worker** (`src/workers/vlmWorker.js`). The main thread only does UI and message routing.

### Data flow

```
User input (InputBar)
  → useChat.sendMessage()          # builds context, posts to worker
  → vlmWorker (generate)           # tokenize → model.generate → TextStreamer
  → { type: 'token', text }        # streamed back per token
  → useChat.appendToken()          # appended to last assistant message
  → MessageBubble re-renders
```

### Key files

| File | Responsibility |
|------|---------------|
| `src/workers/vlmWorker.js` | GPU detection, model load, generate, stream tokens |
| `src/hooks/useWorker.js` | Stable worker ref; routes all worker messages via `onMessageRef` |
| `src/hooks/useChat.js` | Message state, `messagesRef` mirror, context window trimming |
| `src/App.jsx` | Wires worker callbacks to chat via `chatCallbacksRef` |

## Important Constraints

- **Never pre-bundle `@huggingface/transformers`** — `optimizeDeps.exclude` in `vite.config.js` must stay
- **Worker must be `type: 'module'`** — initialized with `new Worker(url, { type: 'module' })`
- **COOP/COEP headers are required** — both in `vite.config.js` (dev) and `vercel.json` (prod). Removing them breaks `SharedArrayBuffer` and ONNX WASM threading
- **No localStorage/sessionStorage** — conversation is ephemeral by design
- **No model reload mid-session** — the worker loads once; never re-instantiate it

## Message Format

All messages passed to the model use **content-part arrays** (not plain strings):

```js
// Correct — SmolVLM Jinja2 template iterates message.content
{ role: 'system',    content: [{ type: 'text', text: '...' }] }
{ role: 'user',      content: [{ type: 'image' }, { type: 'text', text: '...' }] }
{ role: 'assistant', content: [{ type: 'text', text: '...' }] }

// Wrong — causes "Expected iterable or object type in for loop: got StringValue"
{ role: 'system', content: 'plain string' }
```

## Text-only vs Vision Generation

```js
// Text-only: use tokenizer directly — processor crashes with null images
inputs = tokenizer(text, { return_tensors: 'pt' });

// With images: use processor
inputs = await processor(text, rawImages, { do_image_splitting: false });
```

## State / Ref Invariant

`messagesRef.current` must always equal the latest `messages` state. It is updated in **three places**:
1. `sendMessage` — adds user + empty assistant placeholder
2. `appendToken` — updates last assistant content token-by-token
3. `clearMessages` — resets to `[]`

Breaking this invariant causes the next `sendMessage` to overwrite streamed content with stale empty bubbles.

## Context Window

| Condition | Max turns (user+assistant pairs) |
|-----------|----------------------------------|
| Any image in any turn | 6 |
| Text-only | 12 |

System prompt is always prepended. Oldest turns are dropped first.

## GPU Dtype Config

| GPU mode | embed_tokens | vision_encoder | decoder_model_merged |
|----------|-------------|----------------|----------------------|
| fp16 (shader-f16 supported) | fp16 | q4f16 | q4f16 |
| compat (Intel iGPU / no f16) | fp32 | q4 | q4 |
