import { PostRepository } from "../../../infrastructure/repositories/PostRepository";

export interface ListFeedRequest {
  cursor?: string;
  limit?: number;
}

export class ListFeedUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(request: ListFeedRequest) {
    const limit = request.limit || 10;
    const posts = await this.postRepository.listFeed(request.cursor, limit);

    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;

    return {
      posts,
      nextCursor,
    };
  }
}
