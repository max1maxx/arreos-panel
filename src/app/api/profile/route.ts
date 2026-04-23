import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/jwt';
import { UpdateUserUseCase } from '../../../core/use-cases/users/UpdateUserUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';

function setCORS(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, PUT, PATCH, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function OPTIONS() {
  return setCORS(NextResponse.json({}, { status: 200 }));
}

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  // 1. Intentar por Header Authorization (Mobile)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);
    if (payload?.id) return payload.id;
  }

  // 2. Intentar por Cookie (Web)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload?.id) return payload.id;
    }
  } catch (e) {
    // cookies() puede fallar en ciertos contextos de Next.js
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return setCORS(NextResponse.json({ error: "No autorizado" }, { status: 401 }));
    }

    const repository = new UserRepository();
    const user = await repository.findById(userId);

    if (!user) {
      return setCORS(NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 }));
    }

    return setCORS(NextResponse.json({ data: user }));
  } catch (error: any) {
    console.error("❌ Error en GET Profile:", error);
    return setCORS(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

export async function PUT(req: Request) {
  return PATCH(req);
}

export async function PATCH(req: Request) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return setCORS(NextResponse.json({ error: "No autorizado" }, { status: 401 }));
    }

    const body = await req.json();
    const useCase = new UpdateUserUseCase();

    // Normalizar datos: Mobile envía campos de perfil en la raíz, Web los envía anidados en 'profile'
    const updateData: any = { ...body };
    
    // Si vienen campos de perfil en la raíz (Mobile), los movemos a 'profile'
    if (body.finca_name !== undefined || body.bio !== undefined || body.license_type !== undefined || body.vehicle_capacity !== undefined) {
      updateData.profile = {
        ...(updateData.profile || {}),
        ...(body.finca_name !== undefined && { finca_name: body.finca_name }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.license_type !== undefined && { license_type: body.license_type }),
        ...(body.vehicle_capacity !== undefined && { vehicle_capacity: Number(body.vehicle_capacity) }),
      };
    }

    const updatedUser = await useCase.execute(userId, updateData);

    console.log(`✅ Perfil actualizado para: ${userId}`);

    return setCORS(NextResponse.json({ 
      success: true, 
      data: updatedUser 
    }));

  } catch (error: any) {
    console.error("❌ Error en PATCH Profile:", error);
    const status = error.message === 'Usuario no encontrado' ? 404 : 
                   (error.message.includes('en uso') || error.message.includes('registrado')) ? 400 : 500;
    
    return setCORS(NextResponse.json({ error: error.message }, { status }));
  }
}
