// @ts-nocheck - Client-side API wrappers for server functions
import { apiCall } from "./api-client";

export type FoodAnalysis = {
  isFood: boolean;
  food: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  nutrients: string[];
  benefits: string[];
  tips: string[];
  confidence: "high" | "medium" | "low";
};

// Food analysis API endpoint
export const analyzeFood = (data: { data: {
  image: string;
  note?: string;
} }) => 
  apiCall<FoodAnalysis>("/api/food/analyze-food", data);
