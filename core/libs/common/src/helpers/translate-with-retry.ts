import { v2 } from '@google-cloud/translate';

export const translateWithRetry = async (
  text: string,
  targetLanguage: string,
  translateService: v2.Translate,
  maxAttempt: number,
) => {
  for (let attempt = 1; attempt <= maxAttempt; attempt++) {
    try {
      const [translatedText] = await translateService.translate(
        text,
        targetLanguage,
      );
      return translatedText;
    } catch (error) {
      if (attempt === maxAttempt) console.log('🚀 ~ error:', error);
    }
  }
};
