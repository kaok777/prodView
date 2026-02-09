import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUseCaseDto {
  @IsString({ message: 'Use case name must be a string' })
  @MinLength(2, { message: 'Use case name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Use case name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_&().,]+$/, {
    message: 'Use case name contains invalid characters',
  })
  name!: string;
}
