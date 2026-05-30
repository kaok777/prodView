import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

/**
 * DTO for fetching Open Graph preview data from a URL
 * Used by admin to auto-populate product information from vendor URLs
 */
export class FetchPreviewDto {
  @IsUrl({}, { message: 'sourceUrl must be a valid URL' })
  @IsString()
  @IsNotEmpty({ message: 'sourceUrl is required' })
  url!: string;
}

/**
 * Response DTO for fetch preview endpoint
 * Returns OG tag data extracted from the URL
 */
export class FetchPreviewResponseDto {
  success!: boolean;
  title!: string | null;
  description!: string | null;
  imageUrl!: string | null;
  failedFields!: string[]; // Array of fields that failed to fetch (e.g., ['image', 'description'])
  error?: string; // Optional error message if fetch completely failed
}
