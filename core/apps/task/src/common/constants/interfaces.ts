export interface TaskListIdName {
  id: number;
  name: string;
}

export interface CreateTaskList {
  event_id: number;
  name: string;
  order?: number;
}
