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

async function saveFile(file: File, folder: string, subfolder: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${uuidv4()}${path.extname(file.name || '.pdf')}`;
    const absoluteFilePath = path.join(process.cwd(), "public", folder, filename);
    await writeFile(absoluteFilePath, buffer);
    return `/${folder}/${filename}`;
  } catch (e: any) {
    console.error(`❌ Error salvando archivo ${subfolder}:`, e.message);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const sellerId = formData.get("sellerId") as string;
    if (!sellerId) return NextResponse.json({ error: "Seller ID missing" }, { status: 400 });

    const livestockId = uuidv4();
    const relativeFolder = `uploads/users/${sellerId}/listings/${livestockId}`;
    const absoluteFolder = path.join(process.cwd(), "public", relativeFolder);
    await mkdir(absoluteFolder, { recursive: true });

    // Procesar Imágenes
    const images = formData.getAll("images") as File[];
    const imageUrls: string[] = [];
    for (const image of images) {
      if (image && image.size > 0) {
        try {
          const bytes = await image.arrayBuffer();
          const buffer = Buffer.from(bytes);
          let finalBuffer = buffer;
          try {
            finalBuffer = await optimizeListingPhotoBuffer(buffer);
          } catch (e) {}
          const filename = `${uuidv4()}.jpg`;
          await writeFile(path.join(absoluteFolder, filename), finalBuffer);
          imageUrls.push(`/${relativeFolder}/${filename}`);
        } catch (e: any) {}
      }
    }

    // Procesar Documentos
    const guideFile = formData.get("guide") as File;
    const certificateFile = formData.get("certificate") as File;
    
    const guideUrl = await saveFile(guideFile, relativeFolder, "guide");
    const certificateUrl = await saveFile(certificateFile, relativeFolder, "certificate");

    const weight = parseFloat(formData.get("weight") as string || "0");
    const price_per_lb = parseFloat(formData.get("price_per_lb") as string || "0");

    const newLivestock = await prisma.livestock.create({
      data: {
        id: livestockId,
        sellerId,
        category: formData.get("category") as string || "Bovino",
        breed: formData.get("breed") as string || "Cruza",
        weight,
        quantity: parseInt(formData.get("quantity") as string || "1"),
        price_per_lb,
        total_price: weight * price_per_lb,
        description: formData.get("description") as string || "",
        images_url: imageUrls,
        guide_url: guideUrl,
        certificate_url: certificateUrl,
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
