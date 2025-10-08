// DTOs for API responses (explicit shapes, avoid `any`)

export interface ProjectDTO {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  color?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemDTO {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  status: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface MachineDTO {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorDTO {
  id: string;
  name: string;
  email?: string | null;
  skills: string[];
  status: string;
  shift?: string | null;
  availability: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTimeSlotDTO {
  id: string;
  taskId: string;
  startDateTime: string;
  endDateTime?: string | null;
  durationMin: number;
  createdAt: string;
  updatedAt: string;
}

// Request DTO for scheduling a task
export interface ScheduleTaskRequestDTO {
  taskId: string;
  // optional: either itemId or projectId may be provided to create/associate an item
  itemId?: string | null;
  projectId?: string | null;
  machineId?: string | null;
  operatorId?: string | null;
  scheduledAt: string; // ISO datetime
  durationMin: number;
}

export interface TaskWithRelationsDTO {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  quantity: number;
  completed_quantity: number;
  item?: ItemDTO | (null & { project?: ProjectDTO | null });
  itemId?: string | null;
  machines?: MachineDTO[]; // Changed from single machine to array
  operators?: OperatorDTO[]; // Changed from single operator to array
  timeSlots?: TaskTimeSlotDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponseDTO extends Omit<TaskWithRelationsDTO, 'item'> {
  item?: ItemDTO | null;
  project?: ProjectDTO | null;
  machines?: MachineDTO[]; // Ensure consistency
  operators?: OperatorDTO[]; // Ensure consistency
}

export function mapTaskToResponse(task: TaskWithRelationsDTO): TaskResponseDTO {
  let project: ProjectDTO | null = null;
  if (task.item && typeof task.item === 'object') {
    const itemObj = task.item as unknown as Record<string, unknown>;
    if ('project' in itemObj && itemObj.project && typeof itemObj.project === 'object') {
      project = itemObj.project as ProjectDTO;
    }
  }
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    quantity: task.quantity,
    completed_quantity: task.completed_quantity,
    item: task.item as ItemDTO | null,
    project,
    machines: task.machines ?? [],
    operators: task.operators ?? [],
    timeSlots: task.timeSlots,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
