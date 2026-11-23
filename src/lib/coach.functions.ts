// @ts-nocheck - Client-side API wrappers for server functions
import { apiCall } from "./api-client";

export type CoachReview = { 
  summary: string; 
  wins: string[]; 
  tips: string[]; 
  moveSuggestion: { from: string; to: string; reason: string } | null 
};

// Coach API endpoints
export const reviewLogs = (data: { data: {
  area: "workout" | "reading" | "roadmap";
  today: string;
  logs: string;
} }) => 
  apiCall<CoachReview>("/api/coach/review-logs", data);
