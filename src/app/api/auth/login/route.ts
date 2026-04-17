import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LoginSchema } from '../../../../lib/validations/auth';
import { UserRepository } from '../../../../infrastructure/repositories/UserRepository';
import { LoginUserUseCase } from '../../../../core/use-cases/auth/LoginUserUseCase';
import { signToken } from '../../../../lib/jwt';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { getRateLimitKey } from '../../../../lib/client-ip';

export async function POST(request: Request) {
  try {
    // 0. Rate limiting por IP para prevenir fuerza bruta y credential stuffing
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { message: 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo más tarde.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // 1. Validar la entrada con Zod
    const validationResult = LoginSchema.safeParse(body);
    if (!validationResult.success) {
      const simplifiedErrors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return NextResponse.json(
        { message: 'Datos de inicio de sesión inválidos', errors: simplifiedErrors },
        { status: 400 }
      );
    }

    // 2. Inyección de dependencias simple
    const repository = new UserRepository();
    const useCase = new LoginUserUseCase(repository);

    // 3. Ejecutar la lógica de negocio pura
    const { user } = await useCase.execute(validationResult.data);

    // 4. Generar el JWT
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Configurar la cookie HttpOnly
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 día (24 horas)
    });

    // 6. Retornar los datos básicos del usuario y el token (necesario para la App móvil)
    console.log('Enviando datos de login para:', user.email, user.first_name, user.last_name);
    
    return NextResponse.json(
      {
        message: 'Inicio de sesión exitoso',
        token, // Agregado para la App
        data: {
          id: user.id,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: user.role,
          profile: user.profile || null,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Credenciales inválidas') {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    
    console.error('[LOGIN_ERROR]', error);
    return NextResponse.json(
      { message: 'Ocurrió un error interno del servidor' },
      { status: 500 }
    );
  }
}
