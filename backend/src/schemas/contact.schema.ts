import { z } from "zod";

// Name/email are collected from the form but always overridable by the logged-in user's real
// account info server-side (see contact.service.ts) — the fields exist so the UI can prefill and
// let a user send on behalf of a different reachable contact if they want, without letting an
// unauthenticated caller spoof a sender identity (auth is required at the route level).
export const submitContactMessageSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  subject: z.string().trim().min(1, "Enter a subject").max(200),
  message: z.string().trim().min(5, "Message is too short").max(4000),
});
export type SubmitContactMessageInput = z.infer<typeof submitContactMessageSchema>;
