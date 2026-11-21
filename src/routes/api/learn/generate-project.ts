import { createFileRoute } from '@tanstack/react-router';
import { authenticateRequest, aiErrorResponse, askJson, readJson } from '@/lib/ai-api';

const str = { type: 'string' };
const strArr = { type: 'array', items: str };
const projectSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'brief', 'requirements'],
  properties: { title: str, brief: str, requirements: strArr },
};

export const Route = createFileRoute('/api/learn/generate-project')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = await authenticateRequest(request);
        if (authError) return authError;

        const body = await readJson(request);
        if (body instanceof Response) return body;
        const { dayTitle, topics, language } = body;
        if (
          typeof dayTitle !== 'string' || !dayTitle.trim() ||
          !Array.isArray(topics) || topics.length === 0 ||
          typeof language !== 'string' || !language.trim()
        ) {
          return Response.json({ message: 'Invalid project request' }, { status: 400 });
        }

        try {
          const result = await askJson<{ title: string; brief: string; requirements: string[] }>(
            "Design one small hands-on build task that combines the day's topics. It must be doable in 30-90 minutes in a single file, typed by hand. Give a catchy title, a 2-3 sentence brief, and 4-6 checkable requirements.",
            `Theme: ${dayTitle}. Topics: ${topics.join(', ')}. Language: ${language}.`,
            projectSchema,
            'project'
          );
          return Response.json(result);
        } catch (error) {
          return aiErrorResponse(error);
        }
      },
    },
  },
});
