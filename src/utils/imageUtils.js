export function fileToBase64DataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function filesToBase64DataURLs(files) {
  return Promise.all(Array.from(files).map(fileToBase64DataURL));
}
