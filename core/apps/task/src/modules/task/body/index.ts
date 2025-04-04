import { ChangeLogColumns } from '@Common/constants';
import {
  CreateTaskDto,
  UpdateTaskDto,
  AddCommentDto,
  CreateBulkTaskDto,
  UploadAttachmentDto,
  CloneListOrTaskDto,
  UpdateTaskAssigneeDto,
  UpdateMultipleTasksDto,
  DeleteMultipleTasksDto,
} from '../dto';

export const createTask = {
  type: CreateTaskDto,
  examples: {
    'Example-1': {
      value: {
        event_id: 1348,
        name: '[Test Task]',
        status: 'Open',
        description: '[Task Description]',
        category_ids: [3, 4],
        start_date: '2023-03-30T16:47:38.515Z',
        deadline: '2023-03-30T16:47:38.515Z',
        user_id: 7,
        task_list_id: 3,
        department_id: 144,
        incident_division_id: 23,
        is_recursive: true,
        recursive: {
          deadlines: [
            '2023-03-22T16:00:00.515Z',
            '2023-03-23T16:00:00.515Z',
            '2023-03-24T16:00:00.515Z',
          ],
          start_dates: [
            '2023-03-22T12:00:00.515Z',
            '2023-03-23T12:00:00.515Z',
            '2023-03-24T12:00:00.515Z',
          ],
        },
        location: {
          latitude: '37.09024',
          longitude: '-95.712891',
        },
        color: '#49D591',
        taskAttachments: [
          { name: 'images.jpeg', url: 'https://www.google.com' },
          { name: 'images.jpeg', url: 'https://ontracktechgroup.com' },
        ],
      },
    },
    'Example-2': {
      value: {
        event_id: 1,
        name: 'Task Name',
        status: 'Open',
        description: 'Task Description',
        category_ids: [1, 2],
        start_date: '2023-03-30T16:47:38.515Z',
        deadline: '2023-03-30T16:47:38.515Z',
        user_id: 1,
        task_list_id: 1,
        department_id: 1,
        incident_division_id: 1,
        is_recursive: false,
        location: {
          latitude: '37.09024',
          longitude: '-95.712891',
        },
        color: '#49D591',
        taskAttachments: [
          { name: 'images.jpeg', url: 'https://www.google.com' },
          { name: 'images.jpeg', url: 'https://ontracktechgroup.com' },
        ],
      },
    },
  },
};

export const updateTask = {
  type: UpdateTaskDto,
  examples: {
    Example: {
      value: {
        event_id: 1,
        name: 'Task Name',
        description: 'Task Description',
        category_ids: [1, 2],
        start_date: '2023-03-30T16:47:38.515Z',
        deadline: '2023-03-30T16:47:38.515Z',
        task_list_id: 1,
        department_id: 1,
        incident_division_id: 1,
        status: 'In Progress',
        location: {
          latitude: '37.09024',
          longitude: '-95.712891',
        },
        change_log_column: ChangeLogColumns.NAME,
        color: '#49D591',
        taskAttachments: [
          { name: 'images.jpeg', url: 'https://www.google.com' },
          { name: 'images.jpeg', url: 'https://ontracktechgroup.com' },
        ],
      },
    },
    'Update-Task-Order': {
      value: {
        event_id: 1,
        order: 2,
      },
    },
  },
};

export const addComment = {
  type: AddCommentDto,
  examples: {
    Example: {
      value: {
        task_id: 1,
        text: 'This is a testing comment',
      },
    },
  },
};

export const createBulkTask = {
  type: CreateBulkTaskDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        tasks: [
          {
            name: 'Task Name 1',
            status: 'In Progress',
            deadline: '2023-03-30T16:47:38.515Z',
            list_name: 'Task List 1',
            incident_division_id: 1,
            priority: false,
            user_id: 7,
            subtasks: [
              {
                name: 'Subtask Name 1-1',
                status: 'Open',
                deadline: '2023-03-30T16:47:38.515Z',
                user_id: 7,
                priority: false,
              },
              {
                name: 'Subtask Name 1-2',
                status: 'Open',
                deadline: '2023-03-30T16:47:38.515Z',
                user_id: 7,
                priority: false,
              },
            ],
          },
          {
            name: 'Task Name 2',
            status: 'Open',
            deadline: '2023-03-30T16:47:38.515Z',
            incident_division_id: 1,
            user_id: 7,
            list_name: 'Task List 2',
            priority: false,
            subtasks: [],
          },
        ],
      },
    },
  },
};

export const uploadAttachment = {
  type: UploadAttachmentDto,
  examples: {
    Example: {
      value: {
        task_id: 1,
        name: 'images.jpeg',
        url: 'https://www.google.com',
      },
    },
  },
};

export const cloneListsOrTasks = {
  type: CloneListOrTaskDto,
  examples: {
    Example: {
      value: {
        cloning_event_id: 2039,
        listed_tasks: [
          {
            task_list_id: 1,
            id: 1,
            start_date: '2023-03-30T16:47:38.515Z',
            deadline: '2023-03-30T16:47:38.515Z',
            status: 'Open',
            isSubtasksClone: true,
            isAttachmentsClone: true,
            incident_division_id: 1,
            department_id: 1,
            user_id: null,
          },
          {
            task_list_id: 1,
            id: 11,
            start_date: '2023-03-30T16:47:38.515Z',
            deadline: '2023-03-30T16:47:38.515Z',
            status: 'Open',
            isSubtasksClone: true,
            isAttachmentsClone: true,
            incident_division_id: null,
            department_id: 1,
            user_id: null,
          },
          {
            task_list_id: 1,
            id: 15,
            start_date: '2023-03-30T16:47:38.515Z',
            deadline: '2023-03-30T16:47:38.515Z',
            status: 'Open',
            isSubtasksClone: true,
            isAttachmentsClone: false,
            incident_division_id: 1,
            department_id: null,
            user_id: 1,
          },
          {
            task_list_id: 31,
            id: 14,
            start_date: '2023-03-30T16:47:38.515Z',
            deadline: '2023-03-30T16:47:38.515Z',
            status: 'Open',
            isSubtasksClone: false,
            isAttachmentsClone: false,
            incident_division_id: 1,
            department_id: null,
            user_id: null,
          },
        ],
        standalone_tasks: [
          {
            id: 17,
            start_date: '2023-03-30T16:47:38.515Z',
            deadline: '2023-03-30T16:47:38.515Z',
            status: 'Open',
            isSubtasksClone: false,
            isAttachmentsClone: false,
            incident_division_id: null,
            department_id: null,
            user_id: null,
          },
          {
            id: 12,
            start_date: '2023-03-30T16:47:38.515Z',
            deadline: '2023-03-30T16:47:38.515Z',
            status: 'Open',
            isSubtasksClone: true,
            isAttachmentsClone: true,
            incident_division_id: 1,
            department_id: null,
            user_id: 1,
          },
        ],
      },
    },
  },
};

export const assignTask = {
  type: UpdateTaskAssigneeDto,
  examples: {
    'Example-1': {
      value: {
        event_id: 1348,
        department_id: 144,
      },
    },
    'Example-2': {
      value: {
        event_id: 1348,
        user_id: 7,
      },
    },
  },
};

export const updateMultipleTasks = {
  type: UpdateMultipleTasksDto,
  examples: {
    'Example-1 (Link to List)': {
      value: {
        event_id: 1348,
        task_ids: [1, 2, 3, 4],
        list_id: 3,
      },
    },
    'Example-2 (Make Standalone)': {
      value: {
        event_id: 1348,
        task_ids: [1, 2, 3, 4],
        list_id: null,
      },
    },
    'Example-3 (Assign To)': {
      value: {
        event_id: 1348,
        task_ids: [1, 2, 3, 4],
        user_id: 7,
      },
    },
    'Example-4 (Assign Division)': {
      value: {
        event_id: 1348,
        task_ids: [1, 2, 3, 4],
        incident_division_id: 382,
      },
    },
    'Example-5 (Deadline)': {
      value: {
        event_id: 1348,
        task_ids: [1, 2, 3, 4],
        deadline: '2023-03-30T16:47:38.515Z',
      },
    },
    'Example-6 (Make Recursive)': {
      value: {
        event_id: 2015,
        task_ids: [3993, 4750],
        recursive: {
          start_dates: ['2023-03-01T09:00:05.000Z', '2023-03-05T09:00:00.000Z'],
          deadlines: ['2023-03-2T16:47:38.000Z', '2023-03-08T16:47:38.000Z'],
        },
      },
    },
  },
};

export const deleteMultipleTasks = {
  type: DeleteMultipleTasksDto,
  examples: {
    Example: {
      value: {
        event_id: 1348,
        task_ids: [1, 2, 3, 4],
      },
    },
  },
};
