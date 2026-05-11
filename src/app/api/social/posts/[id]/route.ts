import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { PostRepository } from "@/infrastructure/repositories/PostRepository";

const postRepository = new PostRepository();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;

    // Ownership check is inside repository logic but we can also do it here
    const success = await postRepository.delete(id, user.id);

    if (!success) {
      return NextResponse.json({ error: "No se pudo borrar el post o no tienes permisos." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
