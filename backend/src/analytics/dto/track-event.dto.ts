import { IsString, IsUUID, IsOptional, IsEnum, MaxLength, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MaxJsonSize, MaxObjectDepth, MaxObjectKeys } from '../../common/validators/metadata.validator';

export enum EventType {
  PRODUCT_VIEW = 'product_view',
  CATEGORY_CLICK = 'category_click',
  USE_CASE_CLICK = 'use_case_click',
  SEARCH = 'search',
  AFFILIATE_CLICK = 'affiliate_click',
}

export class TrackEventDto {
  @IsEnum(EventType, { message: 'Event type must be a valid event type' })
  eventType!: EventType;

  @IsOptional()
  @IsUUID('4', { message: 'Entity ID must be a valid UUID' })
  entityId?: string;

  @IsOptional()
  @IsString({ message: 'Session ID must be a string' })
  @MaxLength(100, { message: 'Session ID must not exceed 100 characters' })
  sessionId?: string;

  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  @MaxJsonSize(10240, { message: 'Metadata size must not exceed 10KB' }) // 10KB limit
  @MaxObjectDepth(5, { message: 'Metadata nesting must not exceed 5 levels' }) // 5 levels max
  @MaxObjectKeys(50, { message: 'Metadata must not have more than 50 total keys' }) // 50 keys max
  metadata?: Record<string, any>;
}

export class AffiliateClickDto {
  @IsUUID('4', { message: 'Product ID must be a valid UUID' })
  productId!: string;

  @IsOptional()
  @IsString({ message: 'Session ID must be a string' })
  @MaxLength(100, { message: 'Session ID must not exceed 100 characters' })
  sessionId?: string;
}
