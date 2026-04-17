import sharp from "sharp";

/** Lado máximo en px; encaja dentro sin ampliar (mantiene proporción). */
const MAX_EDGE = 2048;
/** Calidad JPEG perceptualmente alta, peso mucho menor que PNG/móvil sin comprimir. */
const JPEG_QUALITY = 86;

/**
 * Redimensiona (si hace falta), orienta por EXIF y comprime a JPEG progresivo.
 * Pensado para fotos de publicaciones de ganado.
 */
export async function optimizeListingPhotoBuffer(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: JPEG_QUALITY,
      mozjpeg: true,
      progressive: true,
    })
    .toBuffer();
}
