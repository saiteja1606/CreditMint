import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  initialBalance: z.coerce.number().min(0, 'Initial balance cannot be negative').optional().default(0),
})

export const borrowerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const loanSchema = z.object({
  borrowerId: z.string().min(1, 'Please select a borrower'),
  amount: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, 'Rate cannot be negative').default(0),
  interestType: z.enum(['SIMPLE', 'MONTHLY']).default('SIMPLE'),
  startDate: z.string().min(1, 'Start date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
  reminderEnabled: z.boolean().default(true),
})

export const paymentSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be positive'),
  note: z.string().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
