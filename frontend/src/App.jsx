import { Routes, Route } from "react-router-dom";
import Header from "./layouts/Header";
import Register from "../src/modules/auth/pages/Register";
import Login from "../src/modules/auth/pages/Login";
import Home from "./shared/components/Home";
import Logout from "./modules/auth/pages/Logout";
import MainWorkspace from "./modules/workspace/pages/MainWorkspace";
import MainArea from "./modules/Area/pages/MainArea";
import MainCard from "./modules/Card/pages/MainCard";
import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react';

function App() {

  const [subject, setSubject] = useState('')
  const [isLogged, setIsLogged] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      const { sub, exp } = jwtDecode(localStorage.getItem('accessToken'))

      
      const currentTime = Date.now() / 1000;

      if (exp > currentTime) {
        setSubject(sub)
        setIsLogged(true)
      } else {
        localStorage.removeItem('accessToken');
        setIsLogged(false);
      }
    }
  }, [])

  return (
    <>
      <Header />

      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/workspace" element={<MainWorkspace subject={subject} />} />
      </Routes>
    </>

  )
}

export default App