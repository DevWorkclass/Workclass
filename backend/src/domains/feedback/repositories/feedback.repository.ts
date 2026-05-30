/**
 * Repository feedback. STUB v1.
 */
import type { FeedbackLink, FeedbackResponse } from '../types/feedback.types.js';

export const feedbackRepository = {
  async createLink(_data: Omit<FeedbackLink, 'id' | 'createdAt'>): Promise<FeedbackLink> {
    throw new Error('Not implemented — ÉTAPE 5 backend');
  },
  async findLinkByToken(_token: string): Promise<FeedbackLink | null> {
    throw new Error('Not implemented — ÉTAPE 5 backend');
  },
  async markLinkUsed(_id: string): Promise<void> {
    throw new Error('Not implemented — ÉTAPE 5 backend');
  },
  async createResponse(
    _data: Omit<FeedbackResponse, 'id' | 'createdAt'>,
  ): Promise<FeedbackResponse> {
    throw new Error('Not implemented — ÉTAPE 5 backend');
  },
};
