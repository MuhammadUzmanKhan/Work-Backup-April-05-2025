// src/date-range.decorator.ts
import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export const DateRange = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const { startDate, endDate } = request.query;

    console.log('Received startDate:', startDate);
    console.log('Received endDate:', endDate);

    // Ensure startDate and endDate are provided and are valid dates
    if (!startDate || !endDate) {
      throw new BadRequestException('Both startDate and endDate are required.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (end < start) {
      throw new BadRequestException('End date cannot be before start date.');
    }

    return { startDate: start, endDate: end };
  },
);
