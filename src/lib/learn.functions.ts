// @ts-nocheck - Client-side API wrappers for server functions
import { apiCall } from "./api-client";
import type { CodeReview, Lesson } from "@/lib/fittrack-data";

// Learning API endpoints
export const generateLesson = (data: { 
  dayTitle: string; 
  topic: string; 
  language: string; 
}) => 
  apiCall<Lesson>("/api/learn.generateLesson", data);

export const reviewCode = (data: { 
  task: string; 
  code: string; 
  language: string; 
}) => 
  apiCall<CodeReview>("/api/learn.reviewCode", data);

export const generateProject = (data: { 
  dayTitle: string; 
  topics: string[]; 
  language: string; 
}) => 
  apiCall<{ title: string; brief: string; requirements: string[] }>("/api/learn.generateProject", data);
