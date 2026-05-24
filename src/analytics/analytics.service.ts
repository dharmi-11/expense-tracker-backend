import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string, month?: string) {
    const activeMonth = month ?? new Date().toISOString().slice(0, 7);
    const [startDate, endDate] = this.getMonthBounds(activeMonth);

    const [transactions, budgets] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: {
          userId,
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          transactionDate: 'desc',
        },
      }),
      this.prisma.budget.findMany({
        where: {
          userId,
          month: activeMonth,
        },
      }),
    ]);

    const totalIncome = transactions
      .filter((transaction) => transaction.type === 'INCOME')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const totalExpenses = transactions
      .filter((transaction) => transaction.type === 'EXPENSE')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const totalBudget = budgets.reduce(
      (sum, budget) => sum + Number(budget.amount),
      0,
    );

    return {
      month: activeMonth,
      totalIncome,
      totalExpenses,
      remainingBalance: totalIncome - totalExpenses,
      totalBudget,
      budgetProgress:
        totalBudget === 0
          ? 0
          : Math.min((totalExpenses / totalBudget) * 100, 100),
      recentTransactions: transactions.slice(0, 5).map((transaction) => ({
        id: transaction.id,
        title: transaction.title,
        amount: Number(transaction.amount),
        type: transaction.type,
        transactionDate: transaction.transactionDate.toISOString(),
        category: {
          name: transaction.category.name,
          color: transaction.category.color,
        },
      })),
    };
  }

  async getCategoryBreakdown(userId: string, month?: string) {
    const activeMonth = month ?? new Date().toISOString().slice(0, 7);
    const [startDate, endDate] = this.getMonthBounds(activeMonth);

    const transactions = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const categories = await this.prisma.category.findMany({
      where: {
        id: {
          in: transactions.map((item) => item.categoryId),
        },
      },
    });

    const categoryMap = new Map(
      categories.map((category) => [category.id, category]),
    );

    return transactions.map((item) => ({
      categoryId: item.categoryId,
      category: categoryMap.get(item.categoryId)?.name ?? 'Other',
      color: categoryMap.get(item.categoryId)?.color ?? '#64748b',
      amount: Number(item._sum.amount ?? 0),
    }));
  }

  async getMonthlyTrends(userId: string, months = 6) {
    const endDate = new Date();
    const startDate = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth() - (months - 1),
        1,
      ),
    );

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: startDate,
        },
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    const trendMap = new Map<
      string,
      { month: string; income: number; expenses: number }
    >();

    for (let index = 0; index < months; index += 1) {
      const pointDate = new Date(
        Date.UTC(
          endDate.getUTCFullYear(),
          endDate.getUTCMonth() - (months - 1 - index),
          1,
        ),
      );
      const key = pointDate.toISOString().slice(0, 7);
      trendMap.set(key, {
        month: key,
        income: 0,
        expenses: 0,
      });
    }

    transactions.forEach((transaction) => {
      const monthKey = transaction.transactionDate.toISOString().slice(0, 7);
      const bucket = trendMap.get(monthKey);

      if (!bucket) {
        return;
      }

      if (transaction.type === 'INCOME') {
        bucket.income += Number(transaction.amount);
      } else {
        bucket.expenses += Number(transaction.amount);
      }
    });

    return Array.from(trendMap.values());
  }

  private getMonthBounds(month: string) {
    const [year, monthIndex] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthIndex - 1, 1));
    const endDate = new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59, 999));
    return [startDate, endDate] as const;
  }
}
