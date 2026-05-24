import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    await this.ensureExpenseCategory(userId, dto.categoryId);

    const budget = await this.prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId,
          categoryId: dto.categoryId,
          month: dto.month,
        },
      },
      create: {
        userId,
        categoryId: dto.categoryId,
        amount: new Prisma.Decimal(dto.amount),
        month: dto.month,
      },
      update: {
        amount: new Prisma.Decimal(dto.amount),
      },
      include: {
        category: true,
      },
    });

    return this.serializeBudget(budget, 0);
  }

  async findAll(userId: string, month?: string) {
    const activeMonth = month ?? new Date().toISOString().slice(0, 7);
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        month: activeMonth,
      },
      include: {
        category: true,
      },
      orderBy: { category: { name: 'asc' } },
    });

    const [startDate, endDate] = this.getMonthBounds(activeMonth);
    const spending = await this.prisma.transaction.groupBy({
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

    const spentMap = new Map(
      spending.map((item) => [item.categoryId, Number(item._sum.amount ?? 0)]),
    );

    return budgets.map((budget) =>
      this.serializeBudget(budget, spentMap.get(budget.categoryId) ?? 0),
    );
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    await this.findOne(userId, id);

    if (dto.categoryId) {
      await this.ensureExpenseCategory(userId, dto.categoryId);
    }

    const budget = await this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.amount !== undefined
          ? { amount: new Prisma.Decimal(dto.amount) }
          : {}),
        ...(dto.month ? { month: dto.month } : {}),
      },
      include: {
        category: true,
      },
    });

    return this.serializeBudget(budget, 0);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.budget.delete({ where: { id } });
    return { success: true };
  }

  private async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found.');
    }

    return budget;
  }

  private async ensureExpenseCategory(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    if (category.type !== 'EXPENSE') {
      throw new ForbiddenException(
        'Budgets can only be created for expense categories.',
      );
    }
  }

  private getMonthBounds(month: string) {
    const [year, monthIndex] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthIndex - 1, 1));
    const endDate = new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59, 999));
    return [startDate, endDate] as const;
  }

  private serializeBudget(
    budget: Prisma.BudgetGetPayload<{ include: { category: true } }>,
    spent: number,
  ) {
    const amount = Number(budget.amount);
    const remaining = Math.max(amount - spent, 0);
    return {
      id: budget.id,
      month: budget.month,
      amount,
      spent,
      remaining,
      progress: amount === 0 ? 0 : Math.min((spent / amount) * 100, 100),
      category: {
        id: budget.category.id,
        name: budget.category.name,
        color: budget.category.color,
        icon: budget.category.icon,
      },
    };
  }
}
