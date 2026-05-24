import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { Parser } from 'json2csv';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    await this.ensureCategoryOwnership(userId, dto.categoryId, dto.type);

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        title: dto.title,
        amount: new Prisma.Decimal(dto.amount),
        type: dto.type,
        categoryId: dto.categoryId,
        transactionDate: new Date(dto.transactionDate),
        notes: dto.notes,
      },
      include: {
        category: true,
      },
    });

    return this.serializeTransaction(transaction);
  }

  async findAll(userId: string, query: TransactionQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { notes: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.startDate || query.endDate
        ? {
            transactionDate: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions.map((transaction) =>
        this.serializeTransaction(transaction),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found.');
    }

    return this.serializeTransaction(transaction);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Transaction not found.');
    }

    if (dto.categoryId || dto.type) {
      await this.ensureCategoryOwnership(
        userId,
        dto.categoryId ?? existing.categoryId,
        dto.type ?? existing.type,
      );
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.amount !== undefined
          ? { amount: new Prisma.Decimal(dto.amount) }
          : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.transactionDate
          ? { transactionDate: new Date(dto.transactionDate) }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: { category: true },
    });

    return this.serializeTransaction(updatedTransaction);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
    return { success: true };
  }

  async exportCsv(userId: string, query: TransactionQueryDto) {
    const results = await this.findAll(userId, {
      ...query,
      page: 1,
      limit: 1000,
    });

    const parser = new Parser({
      fields: [
        'title',
        'type',
        'amount',
        'category',
        'transactionDate',
        'notes',
      ],
    });

    return parser.parse(
      results.data.map((transaction) => ({
        title: transaction.title,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category.name,
        transactionDate: transaction.transactionDate,
        notes: transaction.notes ?? '',
      })),
    );
  }

  private async ensureCategoryOwnership(
    userId: string,
    categoryId: string,
    type: TransactionType,
  ) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    if (category.type !== type) {
      throw new ForbiddenException(
        'Category type does not match transaction type.',
      );
    }
  }

  private serializeTransaction(
    transaction: Prisma.TransactionGetPayload<{ include: { category: true } }>,
  ) {
    return {
      id: transaction.id,
      title: transaction.title,
      amount: Number(transaction.amount),
      type: transaction.type,
      notes: transaction.notes,
      transactionDate: transaction.transactionDate.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      category: {
        id: transaction.category.id,
        name: transaction.category.name,
        type: transaction.category.type,
        color: transaction.category.color,
        icon: transaction.category.icon,
      },
    };
  }
}
