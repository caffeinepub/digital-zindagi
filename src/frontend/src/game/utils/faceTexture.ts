import * as THREE from "three";

/**
 * Crops an image (data URL or regular URL) to a circular face region and returns a Three.js CanvasTexture.
 * Always falls back to "DZ" emerald face if image fails.
 */
export function createFaceTexture(
  imageSrc: string,
  onReady: (texture: THREE.CanvasTexture) => void,
): void {
  function fallback() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onReady(new THREE.CanvasTexture(canvas));
      return;
    }
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.fillStyle = "#064420";
    ctx.fill();
    ctx.fillStyle = "#f0c040";
    ctx.font = "bold 80px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DZ", 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    onReady(texture);
  }

  if (!imageSrc) {
    fallback();
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        fallback();
        return;
      }

      // Clip to circle
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw image centered — crop to square, slight top offset for face focus
      const aspect = img.width / img.height;
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;
      if (aspect > 1) {
        sw = img.height;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width;
        sy = Math.min(img.height * 0.05, img.height - sh);
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      onReady(texture);
    } catch {
      fallback();
    }
  };

  img.onerror = fallback;

  // Handle both data URLs and regular URLs
  img.src = imageSrc;
}

/**
 * Creates a canvas texture for text (e.g. Hindi signboards).
 */
export function createTextTexture(
  text: string,
  opts: {
    width?: number;
    height?: number;
    bgColor?: string;
    textColor?: string;
    fontSize?: number;
    font?: string;
  } = {},
): THREE.CanvasTexture {
  const {
    width = 512,
    height = 128,
    bgColor = "rgba(10,40,20,0.95)",
    textColor = "#f0c040",
    fontSize = 48,
    font = "bold sans-serif",
  } = opts;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#f0c040";
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#f0c040";
  ctx.shadowBlur = 12;
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a glowing "Digital Zindagi" logo texture for the building wall.
 */
export function createDZLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#050a08";
  ctx.fillRect(0, 0, 1024, 512);

  const text = "Digital Zindagi";
  ctx.font = "bold 120px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 4; i > 0; i--) {
    ctx.shadowColor = i % 2 === 0 ? "#ff6600" : "#00ff88";
    ctx.shadowBlur = i * 20;
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,100,0,0.3)" : "rgba(0,200,100,0.3)";
    ctx.fillText(text, 512, 220);
  }

  ctx.shadowColor = "#00ff88";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#80ffcc";
  ctx.fillText(text, 512, 220);

  ctx.font = "80px sans-serif";
  ctx.shadowColor = "#ff6600";
  ctx.shadowBlur = 40;
  ctx.fillText("🔥", 180, 200);
  ctx.fillText("🔥", 844, 200);

  ctx.font = "bold 56px sans-serif";
  ctx.fillStyle = "#f0c040";
  ctx.shadowColor = "#f0c040";
  ctx.shadowBlur = 20;
  ctx.fillText("डिजिटल ज़िंदगी", 512, 380);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
