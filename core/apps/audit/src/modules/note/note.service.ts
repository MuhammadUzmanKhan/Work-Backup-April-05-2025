import { Injectable } from '@nestjs/common';
import { User, AuditNote } from '@ontrack-tech-group/common/models';
import { isManyStaffExist, sendStaffNotesUpdate } from '@Modules/staff/helper';
import { PusherService } from '@ontrack-tech-group/common/services';

import { CreateNoteDto } from './dto';

@Injectable()
export class NoteService {
  constructor(private readonly pusherService: PusherService) {}

  async createNote(createNoteDto: CreateNoteDto, user: User) {
    const { staff_ids, message, event_id } = createNoteDto;

    // Validate staff_id exists
    await isManyStaffExist(staff_ids);

    const createdNotes = await AuditNote.bulkCreate(
      staff_ids.map((staff_id) => ({
        staff_id,
        message,
        user_id: user.id,
      })),
    );

    // Format the response as per get api to maintain consistency
    const formattedNotes = await AuditNote.findAll({
      attributes: { exclude: ['user_id'] },
      where: { id: createdNotes.map((note) => note.id) },
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
      useMaster: true,
    });

    sendStaffNotesUpdate(this.pusherService, formattedNotes, event_id);

    return formattedNotes;
  }
}
