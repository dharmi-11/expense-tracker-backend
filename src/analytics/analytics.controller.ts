import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard summary analytics' })
  @ApiQuery({ name: 'month', required: false, example: '2026-05' })
  @ApiOkResponse({ description: 'Dashboard analytics payload' })
  getOverview(
    @CurrentUser() user: { userId: string },
    @Query('month') month?: string,
  ) {
    return this.analyticsService.getOverview(user.userId, month);
  }

  @Get('category-breakdown')
  @ApiOperation({ summary: 'Get expense totals grouped by category' })
  @ApiQuery({ name: 'month', required: false, example: '2026-05' })
  getCategoryBreakdown(
    @CurrentUser() user: { userId: string },
    @Query('month') month?: string,
  ) {
    return this.analyticsService.getCategoryBreakdown(user.userId, month);
  }

  @Get('monthly-trends')
  @ApiOperation({ summary: 'Get monthly income versus expense trends' })
  @ApiQuery({ name: 'months', required: false, example: 6 })
  getMonthlyTrends(
    @CurrentUser() user: { userId: string },
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getMonthlyTrends(
      user.userId,
      Number(months ?? 6),
    );
  }
}
