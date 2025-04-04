import React from 'react';
import { useRoutes } from 'react-router-dom';

import AdminLayout from 'layouts/adminLayout/AdminLayout';
import SignInPage from './SignInAdminPage';
import DashboardPage from './DashboardAdminPage';

const AdminPage = () => {
  const routes = [
    {
      path: '/',
      element: <AdminLayout />,
      children: [
        { path: '', element: <SignInPage /> },
        { path: '/dashboard', element: <DashboardPage /> }
      ]
    }
  ];

  return useRoutes(routes);
};

export default AdminPage;
