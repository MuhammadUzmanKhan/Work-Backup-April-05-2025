import React from "react";
import { Navbar } from "../navbar/navbar";
import { Sidebar } from "../sidebar/sidebar";
import { Outlet } from "react-router-dom";

export default function DefaultLayout() {
  return (
    <React.Fragment>
      <Navbar />
      <Sidebar />
      <main>
        <Outlet />
      </main>
    </React.Fragment>
  );
}
