import type {
  FeedbackLink,
  FeedbackResponse,
  FeedbackSubmitInput,
  FeedbackValidateInput,
} from '../types/feedback.types.js';

export const feedbackService = {
  async validate(_input: FeedbackValidateInput): Promise<FeedbackLink | null> {
    // TODO ÉTAPE 5 : vérifier token (non utilisé, non expiré)
    throw new Error('Not implemented — ÉTAPE 5 backend');
  },
  async submit(_input: FeedbackSubmitInput): Promise<FeedbackResponse> {
    // TODO ÉTAPE 5 : insérer réponse + marquer link utilisé
    throw new Error('Not implemented — ÉTAPE 5 backend');
  },
};
