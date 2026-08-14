import { z } from "zod";

const indianPhone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

// docType is kept as a bare string (not an enum) so a new document category never needs a
// migration — the frontend dropdown is the actual source of truth for the allowed set.
export const claimDocumentSchema = z.object({
  contactPhone: indianPhone,
  contactEmail: z.string().trim().toLowerCase().email("Enter a valid email address"),
  docType: z.string().trim().min(1, "Select a document type").max(50),
  docNumber: z.string().trim().max(100).optional(),
});
export type ClaimDocumentInput = z.infer<typeof claimDocumentSchema>;

export const reviewSchema = z.object({
  adminNotes: z.string().trim().max(500).optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
