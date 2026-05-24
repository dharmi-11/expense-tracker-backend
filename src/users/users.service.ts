import { Injectable, NotFoundException } from '@nestjs/common';
import { defaultCategories } from '../categories/default-categories';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  create(input: { name: string; email: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        categories: {
          create: defaultCategories.map((category) => ({
            ...category,
          })),
        },
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.findById(userId);
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    return this.serialize(updatedUser);
  }

  serialize(user: {
    id: string;
    name: string;
    email: string;
    currency: string;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
    };
  }
}
