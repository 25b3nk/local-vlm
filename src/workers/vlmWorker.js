import {
  AutoProcessor,
  AutoTokenizer,
  Idefics3ForConditionalGeneration,
  RawImage,
  TextStreamer,
} from '@huggingface/transformers';

const MODEL_ID = 'HuggingFaceTB/SmolVLM-256M-Instruct';

let processor = null;
let tokenizer = null;
let model = null;
let gpuMode = null;

async function detectGpuMode() {
  if (!navigator.gpu) return null;
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return null;
  return adapter.features.has('shader-f16') ? 'fp16' : 'compat';
}

function getDtypes(mode) {
  if (mode === 'fp16') {
    return {
      embed_tokens: 'fp16',
      vision_encoder: 'q4f16',
      decoder_model_merged: 'q4f16',
    };
  }
  return {
    embed_tokens: 'fp32',
    vision_encoder: 'q4',
    decoder_model_merged: 'q4',
  };
}

function progressCallback(info) {
  if (info.status === 'progress') {
    self.postMessage({
      type: 'progress',
      file: info.file ?? '',
      percent: info.progress ?? 0,
    });
  }
}

async function loadModel() {
  gpuMode = await detectGpuMode();

  if (!gpuMode) {
    self.postMessage({ type: 'error', message: 'WebGPU is not available in this worker.' });
    return;
  }

  const dtypes = getDtypes(gpuMode);

  processor = await AutoProcessor.from_pretrained(MODEL_ID, {
    progress_callback: progressCallback,
  });

  tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, {
    progress_callback: progressCallback,
  });

  model = await Idefics3ForConditionalGeneration.from_pretrained(MODEL_ID, {
    dtype: dtypes,
    device: 'webgpu',
    progress_callback: progressCallback,
  });

  self.postMessage({ type: 'ready', gpuMode });
}

async function generate({ messages, images }) {
  try {
    // Decode images from base64 data URLs
    let rawImages = null;
    if (images && images.length > 0) {
      rawImages = await Promise.all(images.map((dataUrl) => RawImage.fromURL(dataUrl)));
    }

    // Apply chat template to get the prompt string
    const text = tokenizer.apply_chat_template(messages, {
      tokenize: false,
      add_generation_prompt: true,
    });

    // For text-only messages the Idefics3 processor crashes when images=null
    // because it tries to access image_inputs.rows on an undefined object.
    // Use the tokenizer directly in that case.
    let inputs;
    if (rawImages && rawImages.length > 0) {
      inputs = await processor(text, rawImages, { do_image_splitting: false });
    } else {
      inputs = tokenizer(text, { return_tensors: 'pt' });
    }

    // Streaming callback
    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (token) => {
        self.postMessage({ type: 'token', text: token });
      },
    });

    await model.generate({
      ...inputs,
      max_new_tokens: 512,
      streamer,
    });

    self.postMessage({ type: 'done' });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message ?? String(err) });
  }
}

self.addEventListener('message', async (event) => {
  const { type, messages, images } = event.data;

  if (type === 'load') {
    try {
      await loadModel();
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message ?? String(err) });
    }
  } else if (type === 'generate') {
    await generate({ messages, images });
  }
});

// Auto-load on worker start
loadModel().catch((err) => {
  self.postMessage({ type: 'error', message: err.message ?? String(err) });
});
