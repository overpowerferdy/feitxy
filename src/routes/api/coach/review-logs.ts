import { createFileRoute } from '@tanstack/react-router';
import { authenticateRequest, aiErrorResponse, askJson, readJson } from '@/lib/ai-api';
import type { CoachReview } from '@/lib/coach.functions';

const reviewSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'wins', 'tips', 'moveSuggestion'],
  properties: {
    summary: { type: 'string' },
    wins: { type: 'array', items: { type: 'string' } },
    tips: { type: 'array', items: { type: 'string' } },
    moveSuggestion: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['from', 'to', 'reason'],
          properties: {
            from: { type: 'string', description: 'YYYY-MM-DD missed date' },
            to: { type: 'string', description: 'YYYY-MM-DD new date' },
            reason: { type: 'string' },
          },
        },
      ],
    },
  },
};

export const Route = createFileRoute('/api/coach/review-logs')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = await authenticateRequest(request);
        if (authError) return authError;

        const body = await readJson(request);
        if (body instanceof Response) return body;
        const { area, today, logs } = body;
        if (typeof area !== 'string' || !['workout', 'reading', 'roadmap'].includes(area)) {
          return Response.json({ message: 'Invalid area' }, { status: 400 });
        }
        if (typeof today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
          return Response.json({ message: 'Invalid date' }, { status: 400 });
        }
        if (typeof logs !== 'string' || logs.length > 12000) {
          return Response.json({ message: 'Invalid logs' }, { status: 400 });
        }

        const focus = {
          workout: 'workout logs and weekly schedule. If a planned workout this week (before today) was missed, suggest moving it to a free rest or recovery day later this same week (after today). Never suggest dates in another week.',
          reading: 'Atomic Habits reading logs (pages, minutes, notes). Daily target is 10-20 pages or 15-30 minutes.',
          roadmap: 'programming roadmap topic checklist and coding time. Daily coding target is about 4 hours.',
        }[area as 'workout' | 'reading' | 'roadmap'];

        try {
          const result = await askJson<CoachReview>(
            `You are a friendly, non-judgmental coach inside Feit. Evaluate only the real logs given; never invent activity. No medical diagnoses. Keep each item to one short sentence. Focus: ${focus} Set moveSuggestion to null unless area is workout and a move is truly useful.`,
            `Today is ${today}. Logs (JSON):\n${logs}`,
            reviewSchema,
            'review',
            4000
          );
          return Response.json(result);
        } catch (error) {
          return aiErrorResponse(error);
        }
      },
    },
  },
});
