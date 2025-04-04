import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { parseISO, isAfter } from 'date-fns';

@ValidatorConstraint({ async: false })
export class IsEndDateAfterStartDateConstraint
  implements ValidatorConstraintInterface
{
  validate(endDate: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const startDate = (args.object as any)[relatedPropertyName];
    if (!startDate || !endDate) {
      return false;
    }
    const startDateObj = parseISO(startDate);
    const endDateObj = parseISO(endDate);

    // setting end time to day end
    endDateObj.setHours(23, 59, 59, 999);

    return isAfter(endDateObj, startDateObj);
  }

  defaultMessage() {
    return `End date must be after start date`;
  }
}

export function IsEndDateAfterStartDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsEndDateAfterStartDateConstraint,
    });
  };
}
