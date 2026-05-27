import http from "http";

const TASK_DURATION_MS = 5000;
const CHUNK_MS = 100;

let taskQueue = [];
let currentTask = null;
let isRunning = false;

export const processTask = async (task) => {
  task.elapsed = task.elapsed || 0;
  taskQueue.push(task);

  if (isRunning) return;
  isRunning = true;

  while (taskQueue.length > 0) {

    taskQueue.sort((a, b) => b.priority - a.priority);
    currentTask = taskQueue.shift();
    console.log(`Executing ${currentTask.id} with priority ${currentTask.priority}`);

    while (currentTask.elapsed < TASK_DURATION_MS) {
      await new Promise((r) => setTimeout(r, CHUNK_MS));
      currentTask.elapsed += CHUNK_MS;

      const higherPriorityTask = taskQueue.find(
        (t) => t.priority > currentTask.priority
      );
      if (higherPriorityTask) {
        console.log(`Pausing ${currentTask.id} for higher-priority task`);
        taskQueue.push(currentTask); 
        currentTask = null;
        break;
      }
    }

    if (currentTask && currentTask.elapsed >= TASK_DURATION_MS) {
      try {
        currentTask.setTaskDone("Task done");
      } catch (err) {
        console.error(`Error finishing ${currentTask.id}:`, err.message);
      }
      console.log(`Completed ${currentTask.id} with priority ${currentTask.priority}`);
      currentTask = null;
    }
  }

  isRunning = false;
};
