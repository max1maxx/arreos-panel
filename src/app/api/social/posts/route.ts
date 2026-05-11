import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { PostRepository } from "@/infrastructure/repositories/PostRepository";
import { CreatePostUseCase } from "@/core/use-cases/social/CreatePostUseCase";
import { ListFeedUseCase } from "@/core/use-cases/social/ListFeedUseCase";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRateLimitKey } from "@/lib/client-ip";

const postRepository = new PostRepository();

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

    const body = await req.json();
    const useCase = new CreatePostUseCase(postRepository);
    
    const post = await useCase.execute({
      userId: user.id,
      content: body.content,
      media_urls: body.media_urls,
      latitude: body.latitude,
      longitude: body.longitude,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
