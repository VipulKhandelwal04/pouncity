/**
 * Turn a picked image File into a downscaled JPEG data URL.
 *
 * In this UI phase the photo lives in localStorage, so we downscale to keep it
 * small (a raw phone photo would blow the quota) and use a data URL rather than
 * an object URL so it survives a reload. Blob storage replaces this with the
 * backend; the diary-service field (`photoUrl`) stays the same.
 */
/** Read any file straight to a data URL, unmodified (used for PDFs). */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function fileToDataUrl(file: File, max = 640): Promise<string> {
  const raw = await readFileAsDataUrl(file);

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(raw);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        resolve(raw);
      }
    };
    img.onerror = () => resolve(raw);
    img.src = raw;
  });
}
