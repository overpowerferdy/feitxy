// @ts-nocheck - Client-side API wrappers for server functions
import { apiCall } from "./api-client";

// Push notification API endpoints
export const getPushPublicKey = () => 
  apiCall<{ publicKey: string }>("/api/push.getPushPublicKey", {});

export const savePushSubscription = (data: { 
  endpoint: string; 
  p256dh: string; 
  auth: string; 
  userAgent?: string; 
}) => 
  apiCall<{ ok: boolean }>("/api/push.savePushSubscription", data);

export const removePushSubscription = (data: { endpoint: string }) => 
  apiCall<{ ok: boolean }>("/api/push.removePushSubscription", data);

export const syncReminderSchedule = (data: {
  enabled: boolean;
  options?: { workoutMoves?: Record<string, string>; readingPages?: number };
  timezone: string;
  items: Array<{ id: string; title: string; start: string; end?: string }>;
  changes: Record<string, Record<string, { action: "skip" } | { action: "move"; toDate: string; toTime: string }>>;
}) => 
  apiCall<{ ok: boolean }>("/api/push.syncReminderSchedule", data);

export const sendTestPush = () => 
  apiCall<{ sent: number }>("/api/push.sendTestPush", {});
