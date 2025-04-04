import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateLessThan', async: false })
export class IsDateLessThanConstraint implements ValidatorConstraintInterface {
  validate(startDate: Date, args: any): boolean {
    const endDate = args.object['endDate'];
    return startDate && endDate ? startDate < endDate : true;
  }

  defaultMessage(args: any): string {
    return 'Start date must be less than end date';
  }
}

@ValidatorConstraint({ name: 'isDateGreaterThan', async: false })
export class IsDateGreaterThanConstraint
  implements ValidatorConstraintInterface
{
  validate(endDate: Date, args: any): boolean {
    const startDate = args.object['startDate'];
    return startDate && endDate ? endDate > startDate : true;
  }

  defaultMessage(args: any): string {
    return 'End date must be greater than start date';
  }
}

export function IsDateLessThan(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsDateLessThanConstraint,
    });
  };
}

export function IsDateGreaterThan(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsDateGreaterThanConstraint,
    });
  };
}
