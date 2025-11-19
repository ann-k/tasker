import { useState } from 'react';

import { Box, List, Typography } from '@mui/material';

import { type Task } from '../Settings/TaskItem';
import ProcessTaskItem from './ProcessTaskItem';
import TaskPlayScreen from './TaskPlayScreen';

const STORAGE_KEY = 'tasker-tasks';

function Process() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleToggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseTaskScreen = () => {
    setSelectedTask(null);
  };

  const updateTaskInTree = (
    tasksList: Task[],
    taskId: string,
    updater: (task: Task) => Task,
  ): Task[] => {
    return tasksList.map((task) => {
      if (task.id === taskId) {
        return updater(task);
      }
      if (task.subtasks && task.subtasks.length > 0) {
        return {
          ...task,
          subtasks: updateTaskInTree(task.subtasks, taskId, updater),
        };
      }
      return task;
    });
  };

  const markTaskAndSubtasksAsDone = (task: Task): Task => {
    return {
      ...task,
      status: 'done' as const,
      subtasks: task.subtasks
        ? task.subtasks.map((subtask) => markTaskAndSubtasksAsDone(subtask))
        : undefined,
    };
  };

  const handleTaskComplete = (taskId: string) => {
    setTasks((prevTasks) => {
      const updated = updateTaskInTree(prevTasks, taskId, (task) =>
        markTaskAndSubtasksAsDone(task),
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <>
      <meta name="title" content="Процесс" />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          p: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 500,
            mb: 2,
            color: 'text.primary',
            lineHeight: 1.2,
          }}
        >
          Процесс
        </Typography>

        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {tasks.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              Нет задач
            </Typography>
          ) : (
            tasks.map((task) => (
              <ProcessTaskItem
                key={task.id}
                id={task.id}
                name={task.name}
                duration={task.duration}
                image={task.image}
                status={task.status}
                subtasks={task.subtasks}
                expandedTasks={expandedTasks}
                onToggleExpand={handleToggleExpand}
                onPlay={handleTaskSelect}
              />
            ))
          )}
        </List>
      </Box>

      <TaskPlayScreen
        task={selectedTask}
        open={Boolean(selectedTask)}
        onClose={handleCloseTaskScreen}
        onComplete={handleTaskComplete}
      />
    </>
  );
}

export default Process;
