import { createFileRoute } from '@tanstack/react-router';
import { authenticateRequest, aiErrorResponse, askJson, corsHandlers, readJson } from '@/lib/ai-api';
import type { FoodAnalysis } from '@/lib/food.functions';

const num = { type: 'number' };
const strArr = { type: 'array', items: { type: 'string' } };
const schema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'isFood', 'food', 'portion', 'calories', 'protein', 'carbs', 'fat', 'fiber',
    'nutrients', 'benefits', 'tips', 'confidence',
  ],
  properties: {
    isFood: { type: 'boolean', description: 'false when the photo shows no food or drink' },
    food: { type: 'string' },
    portion: { type: 'string' },
    calories: num,
    protein: num,
    carbs: num,
    fat: num,
    fiber: num,
    nutrients: strArr,
    benefits: strArr,
    tips: strArr,
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
};

export const Route = createFileRoute('/api/food/analyze-food')({
  server: {
    handlers: corsHandlers(async ({ request }) => {
        const authError = await authenticateRequest(request);
        if (authError) return authError;

        const body = await readJson(request);
        if (body instanceof Response) return body;
        const { image, note } = body;
        if (
          typeof image !== 'string' ||
          !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)
        ) {
          return Response.json({ message: 'Invalid image' }, { status: 400 });
        }

        try {
          const result = await askJson<FoodAnalysis>(
            'You are a friendly nutrition helper inside Feit, a personal fitness tracker for a young adult in the Philippines who does dumbbell and bodyweight strength training and is watching protein on a small food budget. Look at the photo, identify the food (Filipino dishes are common), estimate the portion and its nutrition for what is visible. Numbers are rough estimates; round calories to the nearest 10 and grams to whole numbers. Benefits and tips are one short sentence each, plain words, no medical claims or diagnoses. If there is no food, set isFood=false, zeros for numbers and empty lists.',
            [{
              role: 'user',
              content: [
                { type: 'input_text', text: typeof note === 'string' && note ? `The user says: ${note}` : 'What is this food and what does it give me?' },
                { type: 'input_image', image_url: image, detail: 'auto' },
              ],
            }],
            schema,
            'food_analysis',
            3000
          );
          return Response.json(result);
        } catch (error) {
          return aiErrorResponse(error);
        }
      }),
  },
});
