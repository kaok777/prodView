import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

/**
 * Custom validator to ensure at least one field is provided in update DTOs
 * Prevents empty update requests that would succeed without making changes
 */
@ValidatorConstraint({ name: 'RequireAtLeastOne', async: false })
export class RequireAtLeastOneConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;

    // Check if at least one property is defined and not undefined
    const hasAtLeastOneField = Object.keys(object).some(key => {
      return object[key] !== undefined;
    });

    return hasAtLeastOneField;
  }

  defaultMessage(args: ValidationArguments) {
    return 'At least one field must be provided for update';
  }
}

/**
 * Utility function to validate update DTOs have at least one field
 * Can be used in service methods before processing updates
 *
 * Fixed: LOW-B5 - Error Message Leakage
 * Removed internal field names from error messages
 */
export function validateAtLeastOneField(dto: any, allowedFields: string[]): void {
  const hasField = allowedFields.some(field => dto[field] !== undefined);

  if (!hasField) {
    throw new BadRequestException(
      'At least one field must be provided for update'
    );
  }
}
