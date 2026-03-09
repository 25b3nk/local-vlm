export async function detectGpuMode() {
  if (!navigator.gpu) return null; // WebGPU not available

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return null;

  const hasF16 = adapter.features.has('shader-f16');
  return hasF16 ? 'fp16' : 'compat';
}
