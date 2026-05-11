import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { PostRepository } from "@/infrastructure/repositories/PostRepository";
import { CreatePostUseCase } from "@/core/use-cases/social/CreatePostUseCase";
import { ListFeedUseCase } from "@/core/use-cases/social/ListFeedUseCase";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRateLimitKey } from "@/lib/client-ip";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
// Usamos el mismo optimizador de imágenes del mercado si está disponible
import { optimizeListingPhotoBuffer } from "@/lib/optimizeListingImage";

const postRepository = new PostRepository();

export const maxDuration = 60; // 60 segundos
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "10");

    const useCase = new ListFeedUseCase(postRepository);
    const result = await useCase.execute({ cursor, limit });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Rate Limiting
    const rateLimitKey = `post:${getRateLimitKey(req)}`;
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ error: "Demasiadas publicaciones. Intenta más tarde." }, { status: 429 });
    }

    const formData = await req.formData();
    const content = formData.get("content") as string;
    const latRaw = formData.get("latitude");
    const lngRaw = formData.get("longitude");
    
    const latitude = latRaw ? parseFloat(latRaw as string) : undefined;
    const longitude = lngRaw ? parseFloat(lngRaw as string) : undefined;

    const postId = uuidv4();
    const relativeFolder = `community/${user.id}/posts/${postId}`;
    const absoluteFolder = path.join(process.cwd(), "public", relativeFolder);
    
    const images = formData.getAll("images") as File[];
    const imageUrls: string[] = [];
    
    if (images.length > 0) {
      await mkdir(absoluteFolder, { recursive: true });
      for (const image of images) {
        if (image && image.size > 0) {
          try {
            const bytes = await image.arrayBuffer();
            const buffer = Buffer.from(bytes);
            let finalBuffer = buffer;
            try {
              finalBuffer = await optimizeListingPhotoBuffer(buffer);
            } catch (e) {
              console.log("No se pudo optimizar la imagen del post, usando original");
            }
            const filename = `${uuidv4()}.jpg`;
            await writeFile(path.join(absoluteFolder, filename), finalBuffer);
            imageUrls.push(`/${relativeFolder}/${filename}`);
          } catch (e: any) {
             console.error("Error guardando imagen del post:", e);
          }
        }
      }
    }

    const useCase = new CreatePostUseCase(postRepository);
    
    const post = await useCase.execute({
      userId: user.id,
      content: content || "",
      media_urls: imageUrls,
      latitude,
      longitude,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
