class Scheduler {
  constructor(userPreferences) {
    this.workStart = userPreferences.workStartHour || 9;
    this.workEnd = userPreferences.workEndHour || 17;
    this.breakDuration = userPreferences.breakDuration || 15;
    this.lunchBreak = userPreferences.lunchBreak || { start: 12, duration: 60 };
    this.maxTasksPerDay = userPreferences.maxTasksPerDay || 10;
  }

  scheduleTasks(tasks, date) {
    const availableTimeBlocks = this.generateTimeBlocks(date);
    const scheduledTasks = [];
    const unscheduledTasks = [];
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

  prioritizeTasks(tasks) {
    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
    return tasks.sort((a, b) => {
      let scoreA = priorityWeight[a.priority] * 100;
      let scoreB = priorityWeight[b.priority] * 100;
      if (a.dueDate) {
        const daysLeft = Math.max(1, (new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        scoreA += (1 / daysLeft) * 50;
      }
      if (b.dueDate) {
        const daysLeft = Math.max(1, (new Date(b.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        scoreB += (1 / daysLeft) * 50;
      }
      scoreA += (1 / a.estimatedDuration) * 20;
      scoreB += (1 / b.estimatedDuration) * 20;
      return scoreB - scoreA;
    });
  }

  generateTimeBlocks(date) {
    const blocks = [];
    const startDate = new Date(date);
    startDate.setHours(this.workStart, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(this.workEnd, 0, 0, 0);
    let currentTime = startDate;
    const lunchStart = new Date(date);
    lunchStart.setHours(this.lunchBreak.start, 0, 0, 0);
    const lunchEnd = new Date(lunchStart.getTime() + this.lunchBreak.duration * 60000);

    while (currentTime < endDate) {
      const blockEnd = new Date(currentTime);
      blockEnd.setMinutes(currentTime.getMinutes() + 60);
      const isLunch = currentTime >= lunchStart && currentTime < lunchEnd;
      blocks.push({
        start: new Date(currentTime),
        end: blockEnd,
        available: !isLunch,
        task: null,
        isBreak: isLunch,
        breakType: isLunch ? "lunch" : null
      });
      currentTime = blockEnd;
    }
    return blocks;
  }

  findTimeSlot(blocks, task) {
    if (task.preferredTimeOfDay !== "any") {
      const preferredBlocks = blocks.filter(block => {
        if (!block.available) return false;
        const hour = block.start.getHours();
        switch(task.preferredTimeOfDay) {
          case "morning": return hour >= 6 && hour < 12;
          case "afternoon": return hour >= 12 && hour < 17;
          case "evening": return hour >= 17 && hour < 22;
          default: return true;
        }
      });
      const slot = preferredBlocks.find(block => 
        (block.end - block.start) / 60000 >= task.estimatedDuration
      );
      if (slot) return slot;
    }
    return blocks.find(block => 
      block.available && (block.end - block.start) / 60000 >= task.estimatedDuration
    );
  }

  markSlotAsUsed(blocks, usedSlot, task) {
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

  getScheduleBlocks(blocks) {
    return blocks
      .filter(block => block.task || block.isBreak)
      .map(block => ({
        start: block.start,
        end: block.end,
        title: block.task?.title || (block.breakType === "lunch" ? "Lunch Break" : "Break"),
        isBreak: block.isBreak || false,
        taskId: block.task?._id
      }));
  }
}
module.exports = Scheduler;