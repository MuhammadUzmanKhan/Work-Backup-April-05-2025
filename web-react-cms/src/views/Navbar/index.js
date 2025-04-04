import { useNavigate, useLocation } from 'react-router-dom';
import React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Paper from '@mui/material/Paper';

import styles from './navbar.module.scss';
import { ReactComponent as HomeIcon } from 'assets/icons/bottomNavigation/home-icon.svg';
import { ReactComponent as ScoreIcon } from 'assets/icons/bottomNavigation/score-icon.svg';
import { ReactComponent as ResourcesIcon } from 'assets/icons/bottomNavigation/resources-icon.svg';
import { ReactComponent as SettingsIcon } from 'assets/icons/bottomNavigation/settings-icon.svg';
import { ReactComponent as TrophyIcon } from 'assets/icons/bottomNavigation/trophy-icon.svg';

const getTitle = (title) => (
  <Typography variant="overline" color="#C6C6C6">
    {title}
  </Typography>
);

function Navbar() {
  const { t } = useTranslation();
  const [value, setValue] = React.useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(() => {
    setValue(location.pathname);
  }, [location]);

  const routerPush = (location) => navigate(location);
  return (
    <Paper
      className={styles.container}
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: '100' }}
      elevation={3}>
      <BottomNavigation
        className={styles.bottomNavigationContainer}
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}>
        <BottomNavigationAction
          onClick={() => routerPush('/points')}
          label={getTitle(t('Points'))}
          value={'/points'}
          icon={<ScoreIcon />}
        />
        <BottomNavigationAction
          onClick={() => routerPush('/rewards')}
          label={getTitle(t('Rewards'))}
          value={'/rewards'}
          icon={<TrophyIcon />}
        />
        <BottomNavigationAction
          onClick={() => routerPush('/')}
          value={'/'}
          label={getTitle(t('Home'))}
          icon={<HomeIcon />}
        />
        <BottomNavigationAction
          onClick={() => routerPush('/resources')}
          label={getTitle(t('Resources'))}
          value={'/resources'}
          icon={<ResourcesIcon />}
        />
        <BottomNavigationAction
          onClick={() => routerPush('/settings')}
          label={getTitle(t('Settings'))}
          value={'/settings'}
          icon={<SettingsIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
}

export default Navbar;
