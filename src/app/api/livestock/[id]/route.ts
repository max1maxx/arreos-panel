import { NextResponse } from "next/server";
import { LivestockStatus, PrismaClient } from "@prisma/client";

const ALLOWED_STATUSES: LivestockStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "IN_TRANSIT",
];
import { rm } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

function setCORS(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function OPTIONS() {
  return setCORS(NextResponse.json({}, { status: 200 }));
}

const sellerSelect = {
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
  profile: {
    select: {
      finca_name: true,
    },
  },
} as const;

/** Detalle de una publicación (para edición o vista) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const listing = await prisma.livestock.findUnique({
      where: { id },
      include: { seller: { select: sellerSelect } },
    });
    if (!listing) {
      return setCORS(NextResponse.json({ error: "No encontrada" }, { status: 404 }));
    }
    return setCORS(NextResponse.json(listing, { status: 200 }));
  } catch (error: any) {
    return setCORS(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

/** Editar publicación (JSON). Requiere `sellerId` igual al vendedor de la publicación. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.livestock.findUnique({ where: { id } });
    if (!existing) {
      return setCORS(NextResponse.json({ error: "No encontrada" }, { status: 404 }));
    }

    if (!body.sellerId || body.sellerId !== existing.sellerId) {
      return setCORS(NextResponse.json({ error: "No autorizado" }, { status: 403 }));
    }

    const nextWeight =
      body.weight !== undefined && body.weight !== null && String(body.weight).trim() !== ""
        ? parseFloat(String(body.weight))
        : existing.weight;
    const nextPricePerLb =
      body.price_per_lb !== undefined && body.price_per_lb !== null && String(body.price_per_lb).trim() !== ""
        ? parseFloat(String(body.price_per_lb))
        : existing.price_per_lb;
    const nextQuantity =
      body.quantity !== undefined && body.quantity !== null && String(body.quantity).trim() !== ""
        ? parseInt(String(body.quantity), 10)
        : existing.quantity;

    if (Number.isNaN(nextWeight) || Number.isNaN(nextPricePerLb) || Number.isNaN(nextQuantity)) {
      return setCORS(NextResponse.json({ error: "Valores numéricos inválidos" }, { status: 400 }));
    }

    let listingLatitude = existing.listingLatitude;
    let listingLongitude = existing.listingLongitude;
    if (body.listingLatitude !== undefined) {
      if (body.listingLatitude === null || body.listingLatitude === "") {
        listingLatitude = null;
      } else {
        const v = parseFloat(String(body.listingLatitude));
        listingLatitude = Number.isNaN(v) ? existing.listingLatitude : v;
      }
    }
    if (body.listingLongitude !== undefined) {
      if (body.listingLongitude === null || body.listingLongitude === "") {
        listingLongitude = null;
      } else {
        const v = parseFloat(String(body.listingLongitude));
        listingLongitude = Number.isNaN(v) ? existing.listingLongitude : v;
      }
    }

    let nextStatus: LivestockStatus = existing.status;
    if (body.status !== undefined && body.status !== null && String(body.status).trim() !== "") {
      const raw = String(body.status).toUpperCase() as LivestockStatus;
      if (!ALLOWED_STATUSES.includes(raw)) {
        return setCORS(NextResponse.json({ error: "Estado de publicación no válido" }, { status: 400 }));
      }
      nextStatus = raw;
    }

    const updated = await prisma.livestock.update({
      where: { id },
      data: {
        category: body.category !== undefined ? String(body.category) : existing.category,
        breed: body.breed !== undefined ? body.breed : existing.breed,
        weight: nextWeight,
        quantity: nextQuantity,
        price_per_lb: nextPricePerLb,
        total_price: nextWeight * nextPricePerLb,
        description: body.description !== undefined ? body.description : existing.description,
        status: nextStatus,
        province: body.province !== undefined ? (body.province || null) : existing.province,
        city: body.city !== undefined ? (body.city || null) : existing.city,
        listingLatitude,
        listingLongitude,
      },
    });

    return setCORS(NextResponse.json({ success: true, data: updated }));
  } catch (error: any) {
    return setCORS(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const listing = await prisma.livestock.findUnique({

      where: { id },
      select: { sellerId: true },
    });

    if (!listing) {
      return setCORS(NextResponse.json({ error: "No encontrada" }, { status: 404 }));
    }

    await prisma.livestock.delete({
      where: { id },
    });

    const folderPath = path.join(process.cwd(), "public", "uploads", "users", listing.sellerId, "listings", id);

    try {
      await rm(folderPath, { recursive: true, force: true });
      console.log(`✅ Archivos eliminados en: ${folderPath}`);
    } catch (err) {
      console.error("⚠️ No se pudo borrar la carpeta física, quizás no existía:", err);
    }

    return setCORS(NextResponse.json({ success: true, message: "Eliminada correctamente" }));
  } catch (error: any) {
    console.error("❌ Error al eliminar:", error);
    return setCORS(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
