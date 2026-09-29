import { ErrorBox } from '@pepperdash/mobile-control-react-app-core';
import '@pepperdash/mobile-control-react-app-core/style.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './styles.scss';

// Mirrors the <base> calculation in index.html. Mobile Control serves the app from a
// session-scoped path (/mc/app/<token>/<roomKey>/), so the router has to be told where its routes
// start or every navigation lands outside the session.
const basePath = location.pathname.split('/').filter((segment) => segment.length > 0);
basePath.length = basePath.length >= 5 ? 5 : 2;
const basename = `/${basePath.join('/')}`;

const router = createBrowserRouter(
  [{ path: '*', Component: App, errorElement: <ErrorBox /> }],
  { basename }
);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
