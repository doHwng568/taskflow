import { Routes, Route } from "react-router-dom";
import Header from "./layouts/Header";
import Register from "../src/modules/auth/pages/Register";
import Login from "../src/modules/auth/pages/Login";
import Home from "./shared/components/Home";

function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>

  )
}

export default App