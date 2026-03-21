import { Shot } from "@/types/player";
import { scaleX, scaleY, VB_X, VB_Y, VB_W, VB_H } from "./scales";

/* canvas resolution multiplier for crisp output */
const RES = 2;
const CW = Math.round(VB_W * RES);
const CH = Math.round(VB_H * RES);

/* gaussian splat radius in canvas pixels */
const SPLAT_RADIUS = 28 * RES;

/**
 * Build a 256-entry RGBA color gradient:
 *   transparent → blue → cyan → green → yellow → red
 */
function buildPalette(): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0.0, "rgba(0,0,40,0)");
  grad.addColorStop(0.15, "rgba(0,0,180,0.6)");
  grad.addColorStop(0.35, "rgba(0,180,235,0.75)");
  grad.addColorStop(0.5, "rgba(0,210,80,0.8)");
  grad.addColorStop(0.7, "rgba(255,220,0,0.85)");
  grad.addColorStop(0.85, "rgba(255,120,0,0.9)");
  grad.addColorStop(1.0, "rgba(220,30,0,0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1);
  return ctx.getImageData(0, 0, 256, 1).data;
}

/**
 * Render shots as a heatmap canvas and return a data-URL.
 * All pixel work happens off-screen.
 */
export function renderHeatmapCanvas(shots: Shot[]): string | null {
  if (shots.length === 0) return null;

  /* ── 1. draw greyscale density splats ── */
  const canvas = document.createElement("canvas");
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext("2d")!;

  const toCanvasX = (x: number) => ((scaleX(x) - VB_X) / VB_W) * CW;
  const toCanvasY = (y: number) => ((scaleY(y) - VB_Y) / VB_H) * CH;

  for (const shot of shots) {
    const cx = toCanvasX(shot.x);
    const cy = toCanvasY(shot.y);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, SPLAT_RADIUS);
    grad.addColorStop(0, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(
      cx - SPLAT_RADIUS,
      cy - SPLAT_RADIUS,
      SPLAT_RADIUS * 2,
      SPLAT_RADIUS * 2
    );
  }

  /* ── 2. remap greyscale alpha → color palette ── */
  const palette = buildPalette();
  const img = ctx.getImageData(0, 0, CW, CH);
  const px = img.data;

  for (let i = 0; i < px.length; i += 4) {
    const alpha = px[i + 3];
    const idx = alpha * 4;
    px[i] = palette[idx];
    px[i + 1] = palette[idx + 1];
    px[i + 2] = palette[idx + 2];
    px[i + 3] = palette[idx + 3];
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}
