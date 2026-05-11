import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { PostRepository } from "@/infrastructure/repositories/PostRepository";
import { CreateCommentUseCase } from "@/core/use-cases/social/CreateCommentUseCase";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRateLimitKey } from "@/lib/client-ip";

const postRepository = new PostRepository();

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Rate Limiting para comentarios
    const rateLimitKey = `comment:${getRateLimitKey(req)}`;
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ error: "Demasiados comentarios. Intenta más tarde." }, { status: 429 });
    }

    const { id } = await params;
    const body = await req.json();

    const useCase = new CreateCommentUseCase(postRepository);
    const comment = await useCase.execute({
      userId: user.id,
      postId: id,
      content: body.content,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
