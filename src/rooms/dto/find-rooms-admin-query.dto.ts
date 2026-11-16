import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class FindRoomsAdminQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  floor?: number;
}
