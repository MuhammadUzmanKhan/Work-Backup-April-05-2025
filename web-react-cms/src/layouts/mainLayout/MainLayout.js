import React from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import classnames from 'classnames';

import Navbar from 'views/Navbar';
import HeaderWithSwitcher from 'views/Header/HeaderWithSwitcher';
import styles from './mainLayout.module.scss';

function MainLayout() {
  const { selectedTab } = useSelector((state) => state.points);

  return (
    <div
      className={classnames([
        styles.container,
        {
          [styles.backgroundOgange]: selectedTab === 1,
          [styles.backgroundGreen]: selectedTab === 2
        }
      ])}>
      <div className={styles.logoContainer} dir="ltr">
        <HeaderWithSwitcher isWhite />
      </div>
      <Navbar />
      <Outlet />
    </div>
  );
}

export default MainLayout;
