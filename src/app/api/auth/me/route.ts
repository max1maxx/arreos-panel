import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../../lib/jwt';
import { UserRepository } from '../../../../infrastructure/repositories/UserRepository';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { message: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Opcional: Podrías devolver el payload directamente para ser muy rápido,
    // pero consultar la BD asegura que el usuario no haya sido borrado/baneado
    // y devuelve los datos del perfil actualizados.
    const repository = new UserRepository();
    const user = await repository.findById(payload.id);

    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          phone: user.phone,
          is_verified: user.is_verified,
          profile: user.profile,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[ME_ERROR]', error);
    return NextResponse.json(
      { message: 'Ocurrió un error interno del servidor' },
      { status: 500 }
    );
  }
}
