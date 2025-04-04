import {
  CreateSubtaskDto,
  RemoveSubtaskAttachmentsDto,
  UpdateSubtaskDto,
  UploadSubtaskAttachmentDto,
} from '../dto';

export const createSubtaskTask = {
  type: CreateSubtaskDto,
  examples: {
    Example: {
      value: {
        name: 'Subtask Name',
        deadline: '2023-03-30T16:47:38.515Z',
        start_date: '2023-03-30T16:47:38.515Z',
        parent_id: 1,
        status: 'Open',
        category_ids: [3, 4],
        description:
          'Lorem ipsum is a placeholder text commonly used in the design and printing industry.',
        subtasksAttachments: [
          { name: 'images.jpeg', url: 'https://www.google.com' },
          { name: 'images.jpeg', url: 'https://ontracktechgroup.com' },
        ],
        user_id: 1,
        department_id: 1,
      },
    },
  },
};

export const uploadSubtaskAttachment = {
  type: UploadSubtaskAttachmentDto,
  examples: {
    Example: {
      value: {
        parent_id: 1,
        subtask_id: 1,
        subtasksAttachments: [
          { name: 'images.jpeg', url: 'https://www.google.com' },
          { name: 'images.jpeg', url: 'https://ontracktechgroup.com' },
        ],
      },
    },
  },
};

export const removeSubtaskAttachments = {
  type: RemoveSubtaskAttachmentsDto,
  examples: {
    Example: {
      value: {
        parent_id: 1,
        attachment_ids: [1, 2],
      },
    },
  },
};

export const updateSubtask = {
  type: UpdateSubtaskDto,
  examples: {
    Example: {
      value: {
        name: 'Subtask Name',
        deadline: '2023-03-30T16:47:38.515Z',
        start_date: '2023-03-30T16:47:38.515Z',
        parent_id: 1,
        status: 'Open',
        category_ids: [3, 4],
        description:
          'Lorem ipsum is a placeholder text commonly used in the design and printing industry.',
        subtasksAttachments: [
          { name: 'images.jpeg', url: 'https://www.google.com' },
          { name: 'images.jpeg', url: 'https://ontracktechgroup.com' },
        ],
        subtask_change_log: {
          isNameUpdated: true,
          isDescriptionUpdated: true,
          isDeadlineUpdated: true,
          isAttachmentUpdated: true,
          isStatusUpdated: true,
          isStartDateUpdated: true,
        },
        user_id: 1,
        department_id: 1,
      },
    },
  },
};
