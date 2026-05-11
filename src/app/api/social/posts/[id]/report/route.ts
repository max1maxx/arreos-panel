import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { PostRepository } from "@/infrastructure/repositories/PostRepository";
import { ReportPostUseCase } from "@/core/use-cases/social/ReportPostUseCase";

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

    const useCase = new ReportPostUseCase(postRepository);
    const report = await useCase.execute({
      reporterId: user.id,
      postId: id,
      reason: body.reason,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
