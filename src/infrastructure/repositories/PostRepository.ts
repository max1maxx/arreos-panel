import { PrismaClient, Post, Comment, Interaction, Report, InteractionType, ReportStatus } from "@prisma/client";
import prisma from "../database/prisma";

export class PostRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: {
    userId: string;
    content: string;
    media_urls: string[];
    shortId: string;
    listingLatitude?: number;
    listingLongitude?: number;
  }): Promise<Post> {
    const { listingLatitude, listingLongitude, ...rest } = data;
    
    // Si hay coordenadas, usamos SQL puro para el campo location (PostGIS)
    if (listingLatitude && listingLongitude) {
      return await this.prisma.$transaction(async (tx) => {
        const post = await tx.post.create({
          data: {
            ...rest,
            listingLatitude,
            listingLongitude,
          },
        });

        await tx.$executeRawUnsafe(
          `UPDATE "Post" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
          listingLongitude,
          listingLatitude,
          post.id
        );

        return post;
      });
    }

    return await this.prisma.post.create({
      data: rest,
    });
  }

  async findById(id: string) {
    return await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
            interactions: true,
          },
        },
      },
    });
  }

  async listFeed(cursor?: string, limit: number = 10) {
    return await this.prisma.post.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            interactions: true,
          },
        },
      },
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const post = await this.prisma.post.findFirst({
      where: { id, userId },
    });

    if (!post) return false;

    await this.prisma.post.delete({
      where: { id },
    });

    return true;
  }

  async toggleInteraction(userId: string, postId: string, type: InteractionType) {
    const existing = await this.prisma.interaction.findUnique({
      where: {
        userId_postId_type: {
          userId,
          postId,
          type,
        },
      },
    });

    if (existing) {
      await this.prisma.interaction.delete({
        where: { id: existing.id },
      });
      return { action: "removed", type };
    } else {
      await this.prisma.interaction.create({
        data: { userId, postId, type },
      });
      return { action: "added", type };
    }
  }

  async addComment(userId: string, postId: string, content: string) {
    return await this.prisma.comment.create({
      data: {
        userId,
        postId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });
  }

  async createReport(reporterId: string, postId: string, reason: string) {
    return await this.prisma.report.create({
      data: {
        reporterId,
        postId,
        reason,
        status: "PENDING",
      },
    });
  }
}
