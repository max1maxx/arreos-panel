import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { optimizeListingPhotoBuffer } from "@/lib/optimizeListingImage";

const prisma = new PrismaClient();

/**
 * GET: Obtener listado de ganado con filtros opcionales.
 * El middleware global maneja los encabezados CORS.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    // Construcción dinámica del filtro 'where'
    const where: any = {
      status: "AVAILABLE",
    };

    if (category && category !== "Todos") {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (q) {
      where.OR = [
        { breed: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const listings = await prisma.livestock.findMany({
      where,
      include: {
        seller: {
          select: {
            first_name: true,
            last_name: true,
            profile: { select: { finca_name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(listings);
  } catch (error: any) {
    console.error("❌ Error en GET /api/livestock:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Crear una nueva publicación de ganado.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const sellerId = formData.get("sellerId") as string;
    
    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
    }

    const livestockId = uuidv4();
    const listingFolder = path.join(process.cwd(), "public", "uploads", "users", sellerId, "listings", livestockId);
    await mkdir(listingFolder, { recursive: true });

    const images = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    for (const image of images) {
      if (image && image.size > 0) {
        const bytes = await image.arrayBuffer();
        const buffer = await optimizeListingPhotoBuffer(Buffer.from(bytes));
        const filename = `${uuidv4()}.jpg`;
        await writeFile(path.join(listingFolder, filename), buffer);
        imageUrls.push(`/uploads/users/${sellerId}/listings/${livestockId}/${filename}`);
      }
    }

    const newLivestock = await prisma.livestock.create({
      data: {
        id: livestockId,
        sellerId,
        category: formData.get("category") as string,
        breed: formData.get("breed") as string,
        weight: parseFloat(formData.get("weight") as string || "0"),
        quantity: parseInt(formData.get("quantity") as string || "1"),
        price_per_lb: parseFloat(formData.get("price_per_lb") as string || "0"),
        total_price: (parseFloat(formData.get("weight") as string || "0") * parseFloat(formData.get("price_per_lb") as string || "0")),
        description: formData.get("description") as string,
        images_url: imageUrls,
        status: "AVAILABLE",
        province: formData.get("province") as string,
        city: formData.get("city") as string,
      },
    });

    return NextResponse.json({ success: true, data: newLivestock });
  } catch (error: any) {
    console.error("❌ Error en POST /api/livestock:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
