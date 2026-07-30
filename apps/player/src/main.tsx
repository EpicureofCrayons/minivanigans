import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/sora";
import "./index.css";
import "./store/useTheme"; // applies the persisted theme to <html> on load
import { router } from "./app/router";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
