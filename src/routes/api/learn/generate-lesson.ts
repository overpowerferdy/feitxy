import { createFileRoute } from '@tanstack/react-router';
import { authenticateRequest, aiErrorResponse, askJson, readJson } from '@/lib/ai-api';
import type { Lesson } from '@/lib/fittrack-data';

const str = { type: 'string' };
const strArr = { type: 'array', items: str };
const lessonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'sections', 'example', 'quiz', 'problem'],
  properties: {
    summary: str,
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['heading', 'body'],
        properties: { heading: str, body: str },
      },
    },
    example: { type: 'string', description: 'A short, runnable code example with comments' },
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'options', 'answer', 'explain'],
        properties: {
          question: str,
          options: strArr,
          answer: { type: 'integer', description: '0-based index of the correct option' },
          explain: str,
        },
      },
    },
    problem: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'prompt', 'starter'],
      properties: { title: str, prompt: str, starter: str },
    },
  },
};

function languageFor(title: string) {
  if (title.includes('Vue')) return 'Vue (JavaScript)';
  if (title.includes('React')) return 'React (JSX)';
  if (title.includes('MySQL')) return 'PHP with MySQL (PDO)';
  if (title.includes('PHP')) return 'PHP';
  if (title.includes('Review')) return 'JavaScript, Vue, React or PHP';
  return 'JavaScript';
}

export const Route = createFileRoute('/api/learn/generate-lesson')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = await authenticateRequest(request);
        if (authError) return authError;

        const body = await readJson(request);
        if (body instanceof Response) return body;
        const { dayTitle, topic } = body;
        if (typeof dayTitle !== 'string' || !dayTitle.trim() || typeof topic !== 'string' || !topic.trim()) {
          return Response.json({ message: 'Invalid lesson request' }, { status: 400 });
        }

        try {
          const result = await askJson<Lesson>(
            'You are a patient programming teacher for a beginner-to-intermediate learner. Write clear, friendly, plain-English lessons. Keep each section body to 2-5 short sentences; no markdown symbols. Give exactly 3 sections, exactly 3 multiple-choice quiz questions with 4 options each, and one small practice problem the learner can solve by typing 5-25 lines of code.',
            `Week theme: ${dayTitle}. Topic: ${topic}. Language: ${languageFor(dayTitle)}.`,
            lessonSchema,
            'lesson'
          );
          return Response.json(result);
        } catch (error) {
          return aiErrorResponse(error);
        }
      },
    },
  },
});
