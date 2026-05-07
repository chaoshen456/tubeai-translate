import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Login from "../pages/login/page";
import Dashboard from "../pages/dashboard/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
