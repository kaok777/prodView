import {
  IsString,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Category name must be a string' })
  @MinLength(2, { message: 'Category name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Category name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_&().,]+$/, {
    message: 'Category name contains invalid characters',
  })
  name!: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent category ID must be a valid UUID' })
  parentCategoryId?: string;
}
