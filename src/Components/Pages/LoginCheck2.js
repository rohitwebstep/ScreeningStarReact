import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAdminLogin } from './validateAdminLogin';
import { ApiLoadingContext } from '../ApiLoadingContext';

const LoginCheck2 = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setApiLoading } = useContext(ApiLoadingContext);

  useEffect(() => {
    const authenticate = async () => {
      try {
        await validateAdminLogin(setApiLoading);
        console.log('mynewlocalstorage', localStorage);
        setLoading(false);
      } catch (error) {
        console.error(error.message);
        navigate('/admin-login');
      }
    };

    authenticate();
  }, [navigate, setApiLoading]);

  if (loading) {
    return (
      <div className="flex w-full justify-center items-center h-20">
        <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
      </div>
    );
  }

  return children;
};

export default LoginCheck2;
