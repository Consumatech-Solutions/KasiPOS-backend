import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneOf', async: false })
export class AtLeastOneOfConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;
    const fields = args.constraints as string[];
    return fields.some((field) => {
      const v = object[field];
      return v !== undefined && v !== null && String(v).trim() !== '';
    });
  }

  defaultMessage(args: ValidationArguments): string {
    const fields = (args.constraints as string[]).join(' or ');
    return `At least one of ${fields} must be provided`;
  }
}

export function AtLeastOneOf(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneOf',
      target: object.constructor,
      propertyName,
      constraints: fields,
      options: validationOptions,
      validator: AtLeastOneOfConstraint,
    });
  };
}
