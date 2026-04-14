import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth-server';
import { UpdateUserUseCase } from '../../../../core/use-cases/users/UpdateUserUseCase';
import { DeleteUserUseCase } from '../../../../core/use-cases/users/DeleteUserUseCase';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 403 });
    }

    // Fix for Next.js 15 params: await context.params to ensure it's resolved if it's treated as a Promise
    const params = await context.params;
    const body = await request.json();
    
    const useCase = new UpdateUserUseCase();
    const updatedUser = await useCase.execute(params.id, body);

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 403 });
    }

    const params = await context.params;
    const useCase = new DeleteUserUseCase();
    await useCase.execute(params.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}
