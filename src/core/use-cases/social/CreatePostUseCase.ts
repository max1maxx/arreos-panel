import { PostRepository } from "../../../infrastructure/repositories/PostRepository";
import { v4 as uuidv4 } from "uuid";

export interface CreatePostRequest {
  userId: string;
  content: string;
  media_urls?: string[];
  latitude?: number;
  longitude?: number;
}

export class CreatePostUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(request: CreatePostRequest) {
    // 1. Sanitización básica (XSS prevention)
    const sanitizedContent = this.sanitize(request.content);

    if (!sanitizedContent || sanitizedContent.length < 3) {
      throw new Error("El contenido del post es muy corto.");
    }

    // 2. Generación de ShortID para enlaces compartibles
    const shortId = uuidv4().split("-")[0]; // Simplificado para este ejemplo, idealmente usar nanoid

    // 3. Persistencia
    const post = await this.postRepository.create({
      userId: request.userId,
      content: sanitizedContent,
      media_urls: request.media_urls || [],
      shortId,
      listingLatitude: request.latitude,
      listingLongitude: request.longitude,
    });

    return post;
  }

  private sanitize(text: string): string {
    // Eliminamos etiquetas HTML básicas para evitar XSS simple
    // En un entorno real, usaría 'isomorphic-dompurify' o 'sanitize-html'
    return text
      .replace(/<[^>]*>?/gm, "")
      .trim();
  }
}
