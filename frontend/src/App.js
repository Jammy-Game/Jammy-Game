import React, { Suspense } from "react";
import "./App.css";

// ** Router Import
// import Register from './components/Register/Register'
import MetaMaskError from "./components/MetaMaskError/MetaMaskError";
import { Route, Routes, Navigate } from "react-router-dom";
import Lobby from "./pages/Lobby";
import Join from "./pages/Join";
import Game from "./pages/Game";
import Panel from "./pages/Panel";

const App = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Lobby />} />

        <Route exact path="/join" element={<Join />} />
        <Route exact path="/game" element={<Game />} />
        <Route exact path="/panel" element={<Panel />} />

        <Route path="*" navigate={<Lobby />} />
      </Routes>

      {/* <Register /> */}
      <MetaMaskError />
    </Suspense>
  );
};

export default App;
