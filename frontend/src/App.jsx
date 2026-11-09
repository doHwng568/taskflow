import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Register from "./modules/auth/pages/Register";
import Login from "./modules/auth/pages/Login";
import Home from "./shared/components/Home";
import MainWorkspace from "./modules/workspace/pages/MainWorkspace";
import WorkspaceDetail from "./modules/workspace/pages/WorkspaceDetail";
import Logout from "./modules/auth/pages/Logout";
import BoardPage from "./modules/board/pages/BoardPage";
import PermissionMatrix from "./modules/permission/pages/PermissionMatrix";
import UserManagement from "./modules/user/pages/UserManagement";
import UserProfile from "./modules/profile/pages/UserProfile";

import useThemeStore from "./store/themeStore";

function App() {
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route path="/home" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />

            <Route path="/workspace" element={<MainWorkspace />} />
            <Route path="/workspace/:id" element={<WorkspaceDetail />} />

            <Route path="/board/:workspaceId" element={<BoardPage />} />

            <Route path="/permissions" element={<PermissionMatrix />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/profile" element={<UserProfile />} />

            <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
    );
}

export default App;