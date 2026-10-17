import { useNavigate } from 'react-router-dom';

function Logout({ setIsLogged, setSubject }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');

    if (setIsLogged) setIsLogged(false);
    if (setSubject) setSubject(null);

    navigate('/home');
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}

export default Logout
