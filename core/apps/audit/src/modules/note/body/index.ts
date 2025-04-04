import { CreateNoteDto } from '../dto';

export const createNote = {
  type: CreateNoteDto,
  examples: {
    Example1: {
      value: {
        message: 'Staff member arrived late to shift',
        staff_id: [8085],
      },
    },
  },
};
