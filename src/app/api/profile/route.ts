import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/jwt';

const prisma = new PrismaClient();

function setCORS(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function OPTIONS() {
  return setCORS(NextResponse.json({}, { status: 200 }));
}

export async function PATCH(req: Request) {
  try {
    // 1. Identificar al usuario (puede venir por Token en Header o Cookie)
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = await verifyToken(token);
      userId = payload?.id;
    }

    if (!userId) {
      return setCORS(NextResponse.json({ error: "No autorizado" }, { status: 401 }));
    }

    const body = await req.json();

    // 2. Actualizar Usuario y Perfil en una sola transacción
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone,
        profile: {
          upsert: {
            create: {
              finca_name: body.finca_name,
              bio: body.bio,
            },
            update: {
              finca_name: body.finca_name,
              bio: body.bio,
            }
          }
        }
      },
      include: { profile: true }
    });

    console.log(`✅ Perfil actualizado para: ${userId}`);

    return setCORS(NextResponse.json({ 
      success: true, 
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        profile: updatedUser.profile
      } 
    }));

  } catch (error: any) {
    console.error("❌ Error en PATCH Profile:", error);
    return setCORS(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
