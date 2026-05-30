interface UserPreferences {
  workStartHour?: number;
  workEndHour?: number;
  breakDuration?: number;
  lunchBreak?: { start: number; duration: number };
  maxTasksPerDay?: number;
}

interface TaskData {
  _id: string;
  title: string;
  priority: "urgent" | "high" | "medium" | "low";
  estimatedDuration: number;
  dueDate?: string | Date;
  preferredTimeOfDay?: "morning" | "afternoon" | "evening" | "any";
  status?: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  [key: string]: any;
}

interface TimeBlock {
  start: Date;
  end: Date;
  available: boolean;
  task: { _id: string; title: string; duration: number } | null;
  isBreak: boolean;
  breakType: string | null;
  isWorkHour: boolean;
}

interface ScheduleBlock {
  task?: string;
  startTime: Date;
  endTime: Date;
  title: string;
  isBreak: boolean;
  breakType: string | null;
}

interface ScheduleResult {
  date: Date;
  scheduledTasks: TaskData[];
  unscheduledTasks: TaskData[];
  blocks: ScheduleBlock[];
  stats: {
    totalAvailableMinutes: number;
    totalScheduledMinutes: number;
    totalBreakMinutes: number;
    productivityScore: number;
  };
}

export class Scheduler {
  private workStart: number;
  private workEnd: number;
  private breakDuration: number;
  private lunchBreak: { start: number; duration: number };
  private maxTasksPerDay: number;

  constructor(userPreferences: UserPreferences) {
    this.workStart = userPreferences.workStartHour || 9;
    this.workEnd = userPreferences.workEndHour || 17;
    this.breakDuration = userPreferences.breakDuration || 15;
    this.lunchBreak = userPreferences.lunchBreak || { start: 12, duration: 60 };
    this.maxTasksPerDay = userPreferences.maxTasksPerDay || 10;
  }

  scheduleTasks(tasks: TaskData[], date: Date): ScheduleResult {
    const availableTimeBlocks = this.generateTimeBlocks(date);
    const scheduledTasks: TaskData[] = [];
    const unscheduledTasks: TaskData[] = [];
    const pendingTasks = tasks.filter(t => t.status === "pending");
    const sortedTasks = this.prioritizeTasks(pendingTasks);

    for (const task of sortedTasks) {
      if (scheduledTasks.length >= this.maxTasksPerDay) {
        unscheduledTasks.push(task);
        continue;
      }

      const slot = this.findTimeSlot(availableTimeBlocks, task);

      if (slot) {
        task.scheduledStart = slot.start;
        task.scheduledEnd = new Date(slot.start.getTime() + task.estimatedDuration * 60000);
        task.status = "scheduled";
        scheduledTasks.push(task);
        this.markSlotAsUsed(availableTimeBlocks, slot, task);
      } else {
        unscheduledTasks.push(task);
      }
    }

    const totalScheduledMinutes = scheduledTasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
    const totalAvailableMinutes = (this.workEnd - this.workStart) * 60 - this.lunchBreak.duration;

    return {
      date,
      scheduledTasks,
      unscheduledTasks,
      blocks: this.getScheduleBlocks(availableTimeBlocks),
      stats: {
        totalAvailableMinutes,
        totalScheduledMinutes,
        totalBreakMinutes: this.lunchBreak.duration,
        productivityScore: Math.round((totalScheduledMinutes / totalAvailableMinutes) * 100) || 0
      }
    };
  }

  private prioritizeTasks(tasks: TaskData[]): TaskData[] {
    const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    return tasks.sort((a, b) => {
      let scoreA = priorityWeight[a.priority] * 100;
      let scoreB = priorityWeight[b.priority] * 100;
      if (a.dueDate) {
        const daysLeft = Math.max(1, (new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        scoreA += (1 / daysLeft) * 50;
      }
      if (b.dueDate) {
        const daysLeft = Math.max(1, (new Date(b.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        scoreB += (1 / daysLeft) * 50;
      }
      scoreA += (1 / a.estimatedDuration) * 20;
      scoreB += (1 / b.estimatedDuration) * 20;
      return scoreB - scoreA;
    });
  }

  private generateTimeBlocks(date: Date): TimeBlock[] {
    const blocks: TimeBlock[] = [];
    const dayStart = 6;
    const dayEnd = 22;
    const startDate = new Date(date);
    startDate.setHours(dayStart, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(dayEnd, 0, 0, 0);
    const currentTime = new Date(startDate);
    const workStartDate = new Date(date);
    workStartDate.setHours(this.workStart, 0, 0, 0);
    const workEndDate = new Date(date);
    workEndDate.setHours(this.workEnd, 0, 0, 0);
    const lunchStart = new Date(date);
    lunchStart.setHours(this.lunchBreak.start, 0, 0, 0);
    const lunchEnd = new Date(lunchStart.getTime() + this.lunchBreak.duration * 60000);

    while (currentTime < endDate) {
      const blockEnd = new Date(currentTime);
      blockEnd.setMinutes(currentTime.getMinutes() + 60);
      const isWorkHour = currentTime >= workStartDate && currentTime < workEndDate;
      const isLunch = isWorkHour && currentTime >= lunchStart && currentTime < lunchEnd;
      blocks.push({
        start: new Date(currentTime),
        end: blockEnd,
        available: isWorkHour && !isLunch,
        task: null,
        isBreak: isLunch,
        breakType: isLunch ? "lunch" : null,
        isWorkHour,
      });
      currentTime.setTime(blockEnd.getTime());
    }
    return blocks;
  }

  private findTimeSlot(blocks: TimeBlock[], task: TaskData): TimeBlock | undefined {
    if (task.preferredTimeOfDay !== "any") {
      const preferredBlocks = blocks.filter(block => {
        if (!block.available && task.preferredTimeOfDay !== "evening") return false;
        const hour = block.start.getHours();
        switch (task.preferredTimeOfDay) {
          case "morning": return hour >= 6 && hour < 12;
          case "afternoon": return hour >= 12 && hour < 17;
          case "evening": return hour >= 17 && hour < 22;
          default: return true;
        }
      });
      const slot = preferredBlocks.find(block =>
        (block.end.getTime() - block.start.getTime()) / 60000 >= task.estimatedDuration
      );
      if (slot) return slot;
    }
    return blocks.find(block =>
      block.available && (block.end.getTime() - block.start.getTime()) / 60000 >= task.estimatedDuration
    );
  }

  private markSlotAsUsed(blocks: TimeBlock[], usedSlot: TimeBlock, task: TaskData): void {
    const slot = blocks.find(b => b.start.getTime() === usedSlot.start.getTime());
    if (slot) {
      slot.available = false;
      slot.task = {
        _id: task._id,
        title: task.title,
        duration: task.estimatedDuration
      };
    }
  }

  private getScheduleBlocks(blocks: TimeBlock[]): ScheduleBlock[] {
    return blocks
      .filter(block => block.task || block.isBreak)
      .map(block => ({
        task: block.task?._id,
        startTime: block.start,
        endTime: block.end,
        title: block.task?.title || (block.breakType === "lunch" ? "Lunch Break" : "Break"),
        isBreak: block.isBreak || false,
        breakType: block.isBreak ? (block.breakType || "short") : null,
      }));
  }
}
