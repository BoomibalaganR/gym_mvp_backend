import sharp from "sharp";

export interface OptimizeImageOptions {
  width?: number;
  height?: number;
  quality?: number; // For webp
}

/**
 * Optimize an image buffer using Sharp:
 * - Resize (default: 600x600)
 * - Convert to WEBP
 * - Compress with quality (default: 85)
 */
export async function optimizeImage(
  buffer: Buffer,
  options: OptimizeImageOptions = {}
): Promise<Buffer> {
  const {
    width = 600,
    height = 600,
    quality = 85,
  } = options;

  return await sharp(buffer)
    .resize(width, height, { fit: "cover" })  // Crop + center fit
    .webp({ quality })
    .toBuffer();
}
