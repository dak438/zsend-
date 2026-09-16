import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  timezone: z.string().optional().default('Asia/Kolkata'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const CreateQuestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Quest title is required')
    .max(120, 'Quest title cannot exceed 120 characters'),
  stat: z.enum(['STR', 'INT', 'BIZ', 'VIT'], {
    errorMap: () => ({ message: 'Stat must be one of STR, INT, BIZ, or VIT' }),
  }),
  xpValue: z.number().refine((val) => [15, 30, 50].includes(val), {
    message: 'XP value must be one of the standard effort tiers: 15, 30, or 50 XP',
  }),
  recurring: z.boolean().default(true),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateQuestInput = z.infer<typeof CreateQuestSchema>;
