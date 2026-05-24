import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories for the authenticated user' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiOkResponse({ description: 'Category list' })
  findAll(
    @CurrentUser() user: { userId: string },
    @Query('type') type?: TransactionType,
  ) {
    return this.categoriesService.findAll(user.userId, type);
  }
}
