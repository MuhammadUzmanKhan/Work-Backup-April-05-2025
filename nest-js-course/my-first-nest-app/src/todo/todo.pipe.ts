import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class TodoPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // to change the value in the desired formats
    return value + '2';
  }
}
