import { useNavigate } from 'react-router-dom';

function Logout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');

    navigate('/home');
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}

export default Logout
