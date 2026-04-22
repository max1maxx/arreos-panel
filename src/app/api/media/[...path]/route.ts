import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/**
 * Proxy de Media robusto para servir imágenes desde la carpeta public 
 * superando bloqueos de red y caché en desarrollo.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const relativePath = resolvedParams.path.join("/");
  const absolutePath = path.join(process.cwd(), "public", ...resolvedParams.path);

  console.log(`🖼️ [MEDIA_PROXY] Petición para: ${relativePath}`);

  try {
    // 1. Verificar existencia
    await fs.access(absolutePath);

    // 2. Leer archivo
    const fileBuffer = await fs.readFile(absolutePath);

    // 3. Determinar Content-Type
    const ext = path.extname(absolutePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".pdf": "application/pdf"
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    // 4. Retornar con cabeceras de éxito
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*", // Refuerzo de CORS
      },
    });
  } catch (error) {
    console.error(`❌ [MEDIA_PROXY] Error al leer archivo: ${absolutePath}`);
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }
}
