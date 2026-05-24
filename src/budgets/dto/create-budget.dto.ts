import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({ example: '6da8df8e-f73f-4a9d-b366-df8d53a6817f' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ example: '2026-05' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month!: string;
}
