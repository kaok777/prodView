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

export enum ImageSource {
  MANUAL_UPLOAD = 'MANUAL_UPLOAD',
  OG_FETCH = 'OG_FETCH',
}

export enum ContentSource {
  MANUAL_UPLOAD = 'MANUAL_UPLOAD',
  OG_FETCH = 'OG_FETCH',
}

export enum OgFetchStatus {
  NOT_ATTEMPTED = 'NOT_ATTEMPTED',
  SUCCESS = 'SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILED = 'FAILED',
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
  @MaxLength(10000, { message: 'Description must not exceed 10000 characters' })
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

  // Smart URL Preview Feature Fields
  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }, {
    message: 'Source URL must be a valid HTTP/HTTPS URL',
  })
  @MaxLength(500, { message: 'Source URL must not exceed 500 characters' })
  sourceUrl?: string;

  @IsOptional()
  @IsEnum(ImageSource, { message: 'Image source must be MANUAL_UPLOAD or OG_FETCH' })
  imageSource?: ImageSource;

  @IsOptional()
  @IsEnum(ContentSource, { message: 'Description source must be MANUAL_UPLOAD or OG_FETCH' })
  descriptionSource?: ContentSource;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }, {
    message: 'OG image URL must be a valid HTTP/HTTPS URL',
  })
  @MaxLength(1000, { message: 'OG image URL must not exceed 1000 characters' })
  ogImageUrl?: string;

  @IsOptional()
  @IsEnum(OgFetchStatus, { message: 'OG fetch status must be valid' })
  ogFetchStatus?: OgFetchStatus;
}
