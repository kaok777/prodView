import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator to check the maximum size of a JSON object
 * Prevents memory exhaustion attacks via large metadata objects
 */
export function MaxJsonSize(maxBytes: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'maxJsonSize',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxBytes],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === null || value === undefined) {
            return true; // Let @IsOptional handle this
          }

          try {
            const jsonString = JSON.stringify(value);
            const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');
            return sizeInBytes <= args.constraints[0];
          } catch {
            return false; // Invalid JSON
          }
        },
        defaultMessage(args: ValidationArguments) {
          const maxSize = args.constraints[0];
          const maxKB = Math.floor(maxSize / 1024);
          return `${args.property} must not exceed ${maxKB}KB when serialized`;
        },
      },
    });
  };
}

/**
 * Custom validator to check the maximum nesting depth of an object
 * Prevents DoS attacks via deeply nested objects
 */
export function MaxObjectDepth(maxDepth: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'maxObjectDepth',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxDepth],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === null || value === undefined) {
            return true; // Let @IsOptional handle this
          }

          const getDepth = (obj: any, currentDepth = 0): number => {
            if (currentDepth > args.constraints[0]) {
              return currentDepth; // Early exit if already too deep
            }

            if (typeof obj !== 'object' || obj === null) {
              return currentDepth;
            }

            let maxChildDepth = currentDepth;
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                const childDepth = getDepth(obj[key], currentDepth + 1);
                maxChildDepth = Math.max(maxChildDepth, childDepth);
              }
            }

            return maxChildDepth;
          };

          try {
            const depth = getDepth(value);
            return depth <= args.constraints[0];
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} nesting depth must not exceed ${args.constraints[0]} levels`;
        },
      },
    });
  };
}

/**
 * Custom validator to check the maximum number of keys in an object
 * Prevents DoS attacks via objects with too many properties
 */
export function MaxObjectKeys(maxKeys: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'maxObjectKeys',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxKeys],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === null || value === undefined) {
            return true; // Let @IsOptional handle this
          }

          if (typeof value !== 'object') {
            return false;
          }

          const countKeys = (obj: any): number => {
            let count = 0;
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                count++;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                  count += countKeys(obj[key]);
                }
              }
            }
            return count;
          };

          try {
            const keyCount = countKeys(value);
            return keyCount <= args.constraints[0];
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not have more than ${args.constraints[0]} total keys`;
        },
      },
    });
  };
}
