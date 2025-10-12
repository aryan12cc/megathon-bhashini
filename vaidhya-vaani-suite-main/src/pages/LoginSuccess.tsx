import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LoginSuccess = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token && !user) {
      login(token);
      toast.success('Logged in successfully with Google!');
    } else if (user) {
        navigate('/');
    }
     else {
      toast.error('Google login failed. Please try again.');
      navigate('/login');
    }
  }, [location, login, navigate, user]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Logging you in...</p>
    </div>
  );
};

export default LoginSuccess;
