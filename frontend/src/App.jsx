import { Routes, Route, Navigate } from "react-router-dom";
// Xóa hẳn dòng import Header ở đây nếu còn

import Register from "./modules/auth/pages/Register";
import Login from "./modules/auth/pages/Login";
import Home from "./shared/components/Home";
import Logout from "./modules/auth/pages/Logout";
import BoardPage from "./modules/board/pages/BoardPage";

function App() {
  return (
    <>
      {/* KHÔNG ĐƯỢC ĐỂ THẺ <Header /> Ở ĐÂY NỮA */}

      <Routes>
        <Route path="/" element={<Navigate to="/board" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/board" element={<BoardPage />} />
      </Routes>
    </>
  );
}

export default App;