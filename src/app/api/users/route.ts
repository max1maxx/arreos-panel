import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth-server';
import { ListUsersUseCase } from '../../../core/use-cases/users/ListUsersUseCase';
import { CreateUserAdminUseCase } from '../../../core/use-cases/users/CreateUserAdminUseCase';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 403 });
    }

    const useCase = new ListUsersUseCase();
    const users = await useCase.execute();

    return NextResponse.json(users);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 403 });
    }

    const body = await request.json();
    const useCase = new CreateUserAdminUseCase();
    const newUser = await useCase.execute(body);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}
