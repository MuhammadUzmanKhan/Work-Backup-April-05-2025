import { createBrowserRouter } from "react-router-dom";

import { PersonalWall } from "../pages/WallPage";
import { TimelinePage } from "../pages/TimelinePage";
import { LiveView } from "../pages/LivePage";
import { LoginPage } from "../pages/LoginPage";
import DefaultLayout from "../layouts/default";
import { SignUpPage } from "../pages/SignUpPage";

const router = createBrowserRouter([
  {
    path: "/",
    Component: DefaultLayout,
    loader: async () => {
      if (!localStorage.getItem("user")) {
        window.location.href = "/login";
        return null;
      } else {
        return true;
      }
    },
    children: [
      {
        path: "/live",
        Component: LiveView,
      },
      {
        path: "/timeline/:id",
        Component: TimelinePage,
      },
      {
        path: "/wall",
        Component: PersonalWall,
      },
    ],
  },
  {
    path: "/login",
    Component: LoginPage,
    loader: async () => {
      if (localStorage.getItem("user")) {
        window.location.href = "/live";
        return null;
      }
      return true;
    },
  },
  {
    path: "/signup",
    Component: SignUpPage,
  },
]);

export default router;
