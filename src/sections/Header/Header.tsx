import { useLocation, useNavigate } from 'react-router';

import { AppBar, BottomNavigation, BottomNavigationAction } from '@mui/material';

import routes from '@/routes';
import { useThemeMode } from '@/theme';

function Header() {
  const { themeMode } = useThemeMode();
  const location = useLocation();
  const navigate = useNavigate();
  const menuLabels = routes.filter((route) => route.title);

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={2}
      data-pw={`theme-${themeMode}`}
      enableColorOnDark
    >
      <BottomNavigation showLabels value={location.pathname}>
        {menuLabels.map(({ path, title, icon: Icon }) => (
          <BottomNavigationAction
            onClick={() => navigate(path ?? '')}
            key={path}
            icon={Icon ? <Icon /> : undefined}
            title={title}
            label={title}
            value={path}
          />
        ))}
      </BottomNavigation>
    </AppBar>
  );
}

export default Header;
