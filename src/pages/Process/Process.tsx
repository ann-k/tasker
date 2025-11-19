import { useState } from 'react';

import { Box, List, Typography } from '@mui/material';

import { type Task } from '../Settings/TaskItem';
import ProcessTaskItem from './ProcessTaskItem';

const STORAGE_KEY = 'tasker-tasks';

function Process() {
  const [tasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

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
          variant="h5"
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
                subtasks={task.subtasks}
                expandedTasks={expandedTasks}
                onToggleExpand={handleToggleExpand}
              />
            ))
          )}
        </List>
      </Box>
    </>
  );
}

export default Process;
