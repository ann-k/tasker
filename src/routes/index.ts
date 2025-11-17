import PlayIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';

import asyncComponentLoader from '@/utils/loader';

import { Routes } from './types';

const routes: Routes = [
  {
    component: asyncComponentLoader(() => import('@/pages/Process')),
    path: '/process',
    title: 'Выполнение',
    icon: PlayIcon,
  },
  {
    component: asyncComponentLoader(() => import('@/pages/Accomplishments')),
    path: '/accomplishments',
    title: 'Достижения',
    icon: StarIcon,
  },
  {
    component: asyncComponentLoader(() => import('@/pages/Settings')),
    path: '/settings',
    title: 'Настройка',
    icon: SettingsIcon,
  },
  {
    component: asyncComponentLoader(() => import('@/pages/NotFound')),
    path: '*',
  },
];

export default routes;
