import { InteractionType } from "@prisma/client";
import { PostRepository } from "../../../infrastructure/repositories/PostRepository";

export interface ToggleInteractionRequest {
  userId: string;
  postId: string;
  type: InteractionType;
}

export class ToggleInteractionUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(request: ToggleInteractionRequest) {
    return await this.postRepository.toggleInteraction(
      request.userId,
      request.postId,
      request.type
    );
  }
}
