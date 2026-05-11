import { PostRepository } from "../../../infrastructure/repositories/PostRepository";

export interface ReportPostRequest {
  reporterId: string;
  postId: string;
  reason: string;
}

export class ReportPostUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(request: ReportPostRequest) {
    if (!request.reason || request.reason.length < 10) {
      throw new Error("Por favor, proporciona una razón válida (mínimo 10 caracteres).");
    }

    return await this.postRepository.createReport(
      request.reporterId,
      request.postId,
      request.reason
    );
  }
}
