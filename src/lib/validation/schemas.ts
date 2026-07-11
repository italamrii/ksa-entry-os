import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  companyName: z.string().min(2).max(200),
  country: z.string().min(2).max(100),
  sectorId: z.string().optional(),
  companyType: z.string().min(1),
  entryGoal: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const onboardingSchema = z.object({
  companyName: z.string().min(2).max(200),
  country: z.string().min(2).max(100),
  sectorId: z.string().optional(),
  companyType: z.string().min(1),
  entryGoal: z.string().min(1),
  locale: z.enum(["en", "ar"]).default("en"),
});

export const assessmentSchema = z.object({
  companyOrigin: z.enum(["foreign", "local"]),
  hasForeignEntity: z.boolean(),
  sectorId: z.string().optional(),
  businessActivity: z.string().optional(),
  hiringEmployees: z.boolean(),
  sellingToGov: z.boolean(),
  needsLocalOffice: z.boolean(),
  invoiceCustomers: z.boolean(),
  sectorLicensing: z.boolean(),
  launchTimeline: z.string().optional(),
});

export const settingsSchema = z.object({
  name: z.string().min(2).max(100),
  locale: z.enum(["en", "ar"]),
  companyName: z.string().min(2).max(200).optional(),
  country: z.string().min(2).max(100).optional(),
});

export const requirementSchema = z.object({
  slug: z.string().min(1),
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  descriptionEn: z.string().min(1),
  descriptionAr: z.string().min(1),
  authorityId: z.string().optional().nullable(),
  officialUrl: z.string().url().optional().or(z.literal("")),
  appliesWhenEn: z.string().optional(),
  appliesWhenAr: z.string().optional(),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  categoryEn: z.string().optional(),
  categoryAr: z.string().optional(),
  disclaimerEn: z.string().optional(),
  disclaimerAr: z.string().optional(),
  order: z.number().int().min(0),
  ruleKey: z.string().optional(),
  sectorId: z.string().optional().nullable(),
  isActive: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AssessmentInput = z.infer<typeof assessmentSchema>;
