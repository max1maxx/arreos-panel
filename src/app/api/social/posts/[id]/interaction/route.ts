import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { PostRepository } from "@/infrastructure/repositories/PostRepository";
import { ToggleInteractionUseCase } from "@/core/use-cases/social/ToggleInteractionUseCase";

const postRepository = new PostRepository();

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    
    if (!body.type || !["LIKE", "BOOKMARK"].includes(body.type)) {
      return NextResponse.json({ error: "Tipo de interacción inválido" }, { status: 400 });
    }

    const useCase = new ToggleInteractionUseCase(postRepository);
    const result = await useCase.execute({
      userId: user.id,
      postId: id,
      type: body.type,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
