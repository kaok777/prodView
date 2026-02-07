import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Max(1000, { message: 'Page must not exceed 1000' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page size must be an integer' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Max(100, { message: 'Page size must not exceed 100' })
  pageSize?: number = 20;
}

export class LimitDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number = 10;
}

export class SearchDto extends PaginationDto {
  @IsOptional()
  @Type(() => String)
  @IsString({ message: 'Search keyword must be a string' })
  @MinLength(1, { message: 'Search keyword must be at least 1 character' })
  @MaxLength(100, { message: 'Search keyword must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message: 'Search keyword contains invalid characters',
  })
  keyword?: string;
}
