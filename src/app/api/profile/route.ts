import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth-server';
import { UpdateUserUseCase } from '../../../core/use-cases/users/UpdateUserUseCase';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(currentUser);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Seguridad: Evitar que el usuario modifique su propio rol o estado de verificación desde su perfil
    delete body.role;
    delete body.is_verified;

    const useCase = new UpdateUserUseCase();
    const updatedUser = await useCase.execute(currentUser.id, body);

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}
