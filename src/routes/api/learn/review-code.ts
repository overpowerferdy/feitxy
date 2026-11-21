import { createFileRoute } from '@tanstack/react-router';
import { authenticateRequest, aiErrorResponse, askJson, readJson } from '@/lib/ai-api';
import type { CodeReview } from '@/lib/fittrack-data';

const str = { type: 'string' };
const strArr = { type: 'array', items: str };
const reviewSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'passed', 'summary', 'strengths', 'fixes'],
  properties: {
    score: { type: 'integer', description: '0-100' },
    passed: { type: 'boolean' },
    summary: str,
    strengths: strArr,
    fixes: strArr,
  },
};

export const Route = createFileRoute('/api/learn/review-code')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = await authenticateRequest(request);
        if (authError) return authError;

        const body = await readJson(request);
        if (body instanceof Response) return body;
        const { task, code, language } = body;
        if (
          typeof task !== 'string' || !task.trim() ||
          typeof code !== 'string' || !code.trim() ||
          typeof language !== 'string' || !language.trim()
        ) {
          return Response.json({ message: 'Invalid code review request' }, { status: 400 });
        }

        try {
          const result = await askJson<CodeReview>(
            "You grade a learner's code like a kind but honest teacher. Read the code carefully and mentally run it. passed=true only if it reasonably solves the task (small style issues are fine). Score 0-100. Give at most 3 strengths and at most 4 concrete fixes, each one short sentence. Never rewrite the full solution for them.",
            `Language: ${language}\nTask:\n${task}\n\nLearner's code:\n${code}`,
            reviewSchema,
            'review'
          );
          return Response.json(result);
        } catch (error) {
          return aiErrorResponse(error);
        }
      },
    },
  },
});
