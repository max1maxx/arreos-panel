import { NextResponse } from 'next/server';
import { RegisterSchema } from '../../../../lib/validations/auth';
import { UserRepository } from '../../../../infrastructure/repositories/UserRepository';
import { RegisterUserUseCase } from '../../../../core/use-cases/auth/RegisterUserUseCase';
import { checkRateLimit } from '../../../../lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 0. Rate limiting por IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { message: 'Demasiados intentos. Por favor, intente de nuevo más tarde.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // 1. Validar la entrada con Zod
    const validationResult = RegisterSchema.safeParse(body);
    if (!validationResult.success) {
      const simplifiedErrors = validationResult.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return NextResponse.json(
        { message: 'Datos de registro inválidos', errors: simplifiedErrors },
        { status: 400 }
      );
    }

    // 2. Inyección de dependencias simple
    const repository = new UserRepository();
    const useCase = new RegisterUserUseCase(repository);

    // 3. Ejecutar la lógica de negocio pura
    const { user } = await useCase.execute(validationResult.data);

    // 4. Retornar el usuario (¡Importante!: Nunca devolver el password_hash al frontend)
    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profile: user.profile,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'El correo electrónico ya está registrado') {
      // Mitigación de enumeración de cuentas: 
      return NextResponse.json(
        { message: 'No se pudo completar el registro con los datos proporcionados' }, 
        { status: 400 }
      );
    }
    
    console.error('[REGISTER_ERROR]', error);
    return NextResponse.json(
      { message: 'Ocurrió un error interno del servidor' },
      { status: 500 }
    );
  }
}
