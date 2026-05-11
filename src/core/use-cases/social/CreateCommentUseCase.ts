import { PostRepository } from "../../../infrastructure/repositories/PostRepository";

export interface CreateCommentRequest {
  userId: string;
  postId: string;
  content: string;
}

export class CreateCommentUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(request: CreateCommentRequest) {
    const sanitizedContent = request.content.replace(/<[^>]*>?/gm, "").trim();
    
    if (!sanitizedContent) {
      throw new Error("El comentario no puede estar vacío.");
    }

    return await this.postRepository.addComment(
      request.userId,
      request.postId,
      sanitizedContent
    );
  }
}
