import {
  IsString,
  IsUrl,
  IsEnum,
  IsArray,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
  Matches,
} from 'class-validator';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateProductDto {
  @IsString({ message: 'Product name must be a string' })
  @MinLength(3, { message: 'Product name must be at least 3 characters long' })
  @MaxLength(200, { message: 'Product name must not exceed 200 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_&().,]+$/, {
    message: 'Product name contains invalid characters',
  })
  name!: string;

  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description!: string;

  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }, {
    message: 'Affiliate URL must be a valid HTTP/HTTPS URL',
  })
  @MaxLength(500, { message: 'Affiliate URL must not exceed 500 characters' })
  affiliateUrl!: string;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Status must be DRAFT, PUBLISHED, or ARCHIVED' })
  status?: ProductStatus;

  @IsArray({ message: 'Category IDs must be an array' })
  @IsUUID('4', { each: true, message: 'Each category ID must be a valid UUID' })
  @ArrayMaxSize(10, { message: 'Cannot assign more than 10 categories' })
  categoryIds!: string[];

  @IsArray({ message: 'Use case IDs must be an array' })
  @IsUUID('4', { each: true, message: 'Each use case ID must be a valid UUID' })
  @ArrayMaxSize(10, { message: 'Cannot assign more than 10 use cases' })
  useCaseIds!: string[];

  @IsArray({ message: 'Images must be an array' })
  @IsString({ each: true, message: 'Each image path must be a string' })
  @ArrayMaxSize(20, { message: 'Cannot upload more than 20 images' })
  images!: string[];
}
