import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Sundays } from "./Sundays";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/sundays" element={<Sundays />} />
        <Route path="/" element={<Sundays />} />
      </Routes>
    </Router>
  );
}

export default App;
