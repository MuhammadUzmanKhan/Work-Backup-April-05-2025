import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isAfter, parseISO } from 'date-fns';

@ValidatorConstraint({ async: false })
export class IsNotPastDateConstraint implements ValidatorConstraintInterface {
  validate(date: string) {
    // Parse the date string to a Date object
    if (!date) return;
    const dateObj = parseISO(date);
    // Check if the date is after or equal to today's date
    return (
      isAfter(dateObj, new Date()) ||
      dateObj.toDateString() === new Date().toDateString()
    );
  }

  defaultMessage() {
    return 'Date ($value) should not be in the past!';
  }
}

export function IsNotPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotPastDateConstraint,
    });
  };
}
