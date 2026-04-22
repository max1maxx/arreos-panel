import sharp from "sharp";

/** Lado máximo en px. */
const MAX_EDGE = 1600;
/** Calidad equilibrada. */
const JPEG_QUALITY = 80;

/**
 * Optimizador simplificado para máxima compatibilidad con binarios de Windows.
 */
export async function optimizeListingPhotoBuffer(input: Buffer): Promise<Buffer> {
  // Eliminamos mozjpeg y configuraciones avanzadas que pueden romper binarios nativos
  return sharp(input)
    .rotate() // Respeta orientación EXIF
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: JPEG_QUALITY,
      progressive: true,
    })
    .toBuffer();
}
