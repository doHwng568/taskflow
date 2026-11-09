import { useNavigate } from "react-router-dom";

function Logout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("username");
        localStorage.removeItem("userRole");

        navigate("/home", { replace: true });
        window.location.reload();
    };

    return (
        <button onClick={handleLogout}>
            Logout
        </button>
    );
}

export default Logout;