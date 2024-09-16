import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Monofasico from './routes/monofasico';
import ErrorPage from './routes/error-page';
import Trifasico from './routes/trifasico';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Monofasico />,
    errorElement: <ErrorPage />
  },
  {
    path: "/monofasico",
    element: <Monofasico />,
    errorElement: <ErrorPage />
  }, {
    path: "/trifasico",
    element: <Trifasico />,
    errorElement: <ErrorPage />
  }
])

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
