import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { optimizeListingPhotoBuffer } from "@/lib/optimizeListingImage";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const province = searchParams.get("province");
    const city = searchParams.get("city");

    // Construcción dinámica del filtro 'where'
    const where: any = {
      status: "AVAILABLE",
    };

    // Búsqueda por texto (categoría o raza)
    if (q) {
      where.OR = [
        { category: { contains: q, mode: 'insensitive' } },
        { breed: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Filtro por categoría exacta
    if (category && category !== 'Todos') {
      where.category = category;
    }

    // Filtro por rango de precio total
    if (minPrice || maxPrice) {
      where.total_price = {};
      if (minPrice) where.total_price.gte = parseFloat(minPrice);
      if (maxPrice) where.total_price.lte = parseFloat(maxPrice);
    }

    // Filtro por ubicación (Texto)
    if (province) {
      where.province = { contains: province, mode: 'insensitive' };
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    const listings = await prisma.livestock.findMany({
      where,
      include: {
        seller: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            profile: { select: { finca_name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(listings);
  } catch (error: any) {
    console.error("❌ ERROR GET Livestock:", error.message);
    return NextResponse.json({ error: "Error en listado" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const sellerId = formData.get("sellerId") as string;
    if (!sellerId) return NextResponse.json({ error: "Seller ID missing" }, { status: 400 });

    const livestockId = uuidv4();
    
    // 1. Definimos la carpeta relativa (sin barra inicial)
    const relativeFolder = `uploads/users/${sellerId}/listings/${livestockId}`;
    // 2. Ruta física absoluta para Node.js
    const absoluteFolder = path.join(process.cwd(), "public", relativeFolder);
    
    await mkdir(absoluteFolder, { recursive: true });

    const images = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    console.log(`📸 Procesando ${images.length} imágenes para la carpeta: ${relativeFolder}`);

    for (const image of images) {
      if (image && image.size > 0) {
        try {
          const bytes = await image.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // Optimizamos si es posible
          let finalBuffer = buffer;
          try {
            finalBuffer = await optimizeListingPhotoBuffer(buffer);
          } catch (e) {
            console.warn("Fallo optimización, usando original.");
          }

          const filename = `${uuidv4()}.jpg`;
          const absoluteFilePath = path.join(absoluteFolder, filename);
          const dbPath = `/${relativeFolder}/${filename}`; // Ruta para la DB (con barra inicial)
          
          await writeFile(absoluteFilePath, finalBuffer);
          imageUrls.push(dbPath);
          console.log(`✅ Archivo escrito en: ${absoluteFilePath}`);
        } catch (e: any) {
          console.error("❌ Error escribiendo archivo:", e.message);
        }
      }
    }

    const newLivestock = await prisma.livestock.create({
      data: {
        id: livestockId,
        sellerId,
        category: formData.get("category") as string || "Bovino",
        breed: formData.get("breed") as string || "Cruza",
        weight: parseFloat(formData.get("weight") as string || "0"),
        quantity: parseInt(formData.get("quantity") as string || "1"),
        price_per_lb: parseFloat(formData.get("price_per_lb") as string || "0"),
        total_price: (parseFloat(formData.get("weight") as string || "0") * parseFloat(formData.get("price_per_lb") as string || "0")),
        description: formData.get("description") as string || "",
        images_url: imageUrls,
        status: "AVAILABLE",
        province: formData.get("province") as string || "",
        city: formData.get("city") as string || "",
      },
    });

    return NextResponse.json({ success: true, data: newLivestock });
  } catch (error: any) {
    console.error("❌ ERROR POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
