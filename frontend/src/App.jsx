import { Routes, Route } from "react-router-dom";
import Header from "./layouts/Header";
import Register from "../src/modules/auth/pages/Register";
import Login from "../src/modules/auth/pages/Login";
import Home from "./shared/components/Home";
import MainWorkspace from "../src/modules/workspace/pages/MainWorkspace"
import Logout from "./modules/auth/pages/Logout";
import Test from "./layouts/Test";

function App() {
  
  return (
    <>
      <Header />

      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/test" element={<Test />} />
        <Route path="/workspace" element={<MainWorkspace />} />
      </Routes>
    </>

  )
}

export default App