import {
  CreateTaskListDto,
  TaskByListDto,
  TaskListNamesQueryDto,
  TaskListQueryDto,
  UpdateMultipleTasksDto,
  UpdateTaskListDto,
} from '../dto';

export const createTaskList = {
  type: CreateTaskListDto,
  examples: {
    Example: {
      value: {
        name: 'Task List Name',
        event_id: 1,
      },
    },
  },
};

export const updateTaskList = {
  type: UpdateTaskListDto,
  examples: {
    Example: {
      value: {
        name: 'Task List Name',
        event_id: 1,
      },
    },
    'Update Order': {
      value: {
        event_id: 2086,
        order: 1,
      },
    },
  },
};

export const getAllTaskLists = {
  type: TaskListQueryDto,
  examples: {
    Example: {
      value: {
        event_id: 1,
        keyword: 'Task',
        sort_column: 'name',
        sort_by: 'ASC',
        me: true,
        completed: true,
        selected_list: 1,
        status: 'Open',
        self_created: false,
        filters: [
          {
            filter: 'deadline',
            condition: 'EQ',
            values: ['2023-07-11T00:00:00.000Z', '2023-07-12T00:00:00.000Z'],
          },
          {
            filter: 'assignee',
            condition: 'NOT_EQ',
            values: [1, 2],
          },
        ],
        csv_pdf: 'csv',
        file_name: 'Tasks',
      },
    },
    'Me-Filter (The filter will list all tasks that are self-assigned)': {
      value: {
        event_id: 1,
        me: true,
      },
    },
    'Search-Task (Search a task by Name, Description, Category Name, User Name, Department Name, Division Name)':
      {
        value: {
          event_id: 1,
          keyword: 'Task',
        },
      },
    'Sort-Tasks (Sort tasks on specific columns: name, priority, status, start_date, deadline, created_at, department_name, incident_division_name)':
      {
        value: {
          event_id: 1,
          sort_column: 'name',
          sort_by: 'ASC',
        },
      },
    'Status-Filter (List all tasks with the status mentioned below | status can be: In Progress, Open, Completed, Blocked, Past Due)':
      {
        value: {
          event_id: 1,
          status: 'Open',
        },
      },
    'Task-List-Filter (List all the tasks of provided list_id)': {
      value: {
        event_id: 1,
        selected_list: 1,
      },
    },
    'Custom-Filters (deadline example date must be in mentioned format) (filter value can be: deadline, assignee, status, division, categories) (condition value can be: EQ and NOT_EQ)':
      {
        value: {
          event_id: 1,
          filters: [
            {
              filter: 'deadline',
              condition: 'EQ',
              values: ['2023-07-11T00:00:00.000Z', '2023-07-12T00:00:00.000Z'],
            },
          ],
        },
      },
    'Custom-Filters (assignee department example | Task can be assigned to a department or user, To fetch tasks assigned to a department, you should use the following value as an example)':
      {
        value: {
          event_id: 1,
          filters: [
            {
              filter: 'assignee',
              condition: 'EQ',
              values: ['department:337', 'department:7'],
            },
          ],
        },
      },
    'Custom-Filters (assignee user example | Task can be assigned to a department or user, To fetch tasks assigned to a user, you should use the following value as an example)':
      {
        value: {
          event_id: 1,
          filters: [
            {
              filter: 'assignee',
              condition: 'EQ',
              values: ['user:7', 'user:4', 'user:1'],
            },
          ],
        },
      },
    'Custom-Filters (status example | status can be: In Progress, Open, Completed, Blocked, Past Due)':
      {
        value: {
          event_id: 1,
          filters: [
            {
              filter: 'status',
              condition: 'EQ',
              values: ['Open', 'Completed', 'In Progress', 'Blocked'],
            },
          ],
        },
      },
    'Custom-Filters (List example | Pass Multiple List Id: 1, 2, 3)': {
      value: {
        event_id: 2015,
        filters: [
          {
            filter: 'list',
            condition: 'EQ',
            values: [194, 393],
          },
        ],
      },
    },
    'Custom-Filters (division example)': {
      value: {
        event_id: 1,
        filters: [
          {
            filter: 'division',
            condition: 'EQ',
            values: [1, 2],
          },
        ],
      },
    },
    'Custom-Filters (categories example)': {
      value: {
        event_id: 1,
        filters: [
          {
            filter: 'categories',
            condition: 'EQ',
            values: [2, 5, 99, 1],
          },
        ],
      },
    },
    'Custom-Filters (List and Status Example)': {
      value: {
        event_id: 2015,
        filters: [
          {
            filter: 'status',
            condition: 'EQ',
            values: ['Open', 'In Progress'],
          },
          {
            filter: 'list',
            condition: 'EQ',
            values: [194, 393],
          },
        ],
      },
    },
    'Completed-Filter (List all tasks with the status completed)': {
      value: {
        event_id: 1,
        completed: true,
      },
    },
    'Self-Created-Filter (The filter will list all tasks that are self-created)':
      {
        value: {
          event_id: 1,
          self_created: true,
        },
      },
  },
};

export const updateMultipleTaskList = {
  type: UpdateMultipleTasksDto,
  examples: {
    'Example-1': {
      value: {
        event_id: 1,
        date: '2023-03-30T16:47:38.515Z',
        is_subtask: true,
        task_id: 4404,
      },
    },
    'Example-2': {
      value: {
        event_id: 1,
        incident_division_id: 1,
      },
    },
  },
};

export const getAllTasksByList = {
  type: TaskByListDto,
  examples: {
    Example: {
      value: {
        event_id: 1348,
        keyword: 'Task',
        sort_column: 'name',
        sort_by: 'ASC',
        me: true,
        completed: true,
        task_list_id: 10,
        status: 'Open',
        filters: [
          {
            filter: 'deadline',
            condition: 'EQ',
            value: '2023-07-11T19:00:00.000Z',
          },
          {
            filter: 'assignee',
            condition: 'NOT_EQ',
            value: 1,
          },
        ],
        page_size: 25,
        page: 0,
      },
    },
  },
};

export const getAllTaskListNames = {
  type: TaskListNamesQueryDto,
  examples: {
    Example: {
      value: {
        event_id: 1,
        keyword: 'Task',
        me: true,
        completed: true,
        status: 'Open',
        self_created: false,
        filters: [
          {
            filter: 'deadline',
            condition: 'EQ',
            value: '2023-07-11T19:00:00.000Z',
          },
          {
            filter: 'assignee',
            condition: 'NOT_EQ',
            value: 1,
          },
        ],
      },
    },
  },
};
