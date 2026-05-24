import { TransactionType } from '@prisma/client';

export const defaultCategories = [
  {
    name: 'Salary',
    slug: 'salary',
    type: TransactionType.INCOME,
    color: '#0f766e',
    icon: 'Wallet',
  },
  {
    name: 'Freelance',
    slug: 'freelance',
    type: TransactionType.INCOME,
    color: '#2563eb',
    icon: 'Sparkles',
  },
  {
    name: 'Other',
    slug: 'other-income',
    type: TransactionType.INCOME,
    color: '#7c3aed',
    icon: 'Coins',
  },
  {
    name: 'Food',
    slug: 'food',
    type: TransactionType.EXPENSE,
    color: '#ef4444',
    icon: 'UtensilsCrossed',
  },
  {
    name: 'Rent',
    slug: 'rent',
    type: TransactionType.EXPENSE,
    color: '#ea580c',
    icon: 'House',
  },
  {
    name: 'Shopping',
    slug: 'shopping',
    type: TransactionType.EXPENSE,
    color: '#db2777',
    icon: 'ShoppingBag',
  },
  {
    name: 'Travel',
    slug: 'travel',
    type: TransactionType.EXPENSE,
    color: '#0284c7',
    icon: 'Plane',
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    type: TransactionType.EXPENSE,
    color: '#9333ea',
    icon: 'Clapperboard',
  },
  {
    name: 'Other',
    slug: 'other-expense',
    type: TransactionType.EXPENSE,
    color: '#64748b',
    icon: 'CircleEllipsis',
  },
] as const;
