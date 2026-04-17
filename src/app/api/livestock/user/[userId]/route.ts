import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function setCORS(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function OPTIONS() {
  return setCORS(NextResponse.json({}, { status: 200 }));
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return setCORS(
        NextResponse.json({ error: "User ID is required" }, { status: 400 })
      );
    }

    const myListings = await prisma.livestock.findMany({
      where: { sellerId: userId },
      include: {
        seller: {
          select: {
            first_name: true,
            last_name: true,
            profile: {
              select: {
                finca_name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return setCORS(NextResponse.json(myListings, { status: 200 }));
  } catch (error: any) {
    console.error("❌ Error en MyListings GET:", error);
    return setCORS(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }
}
