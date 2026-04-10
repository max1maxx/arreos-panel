import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    cookieStore.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Inmediatamente expira la cookie
    });

    return NextResponse.json(
      { message: 'Sesión cerrada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error);
    return NextResponse.json(
      { message: 'Ocurrió un error al cerrar sesión' },
      { status: 500 }
    );
  }
}
