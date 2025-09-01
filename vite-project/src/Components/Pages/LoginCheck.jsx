import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApiLoading } from '../ApiLoadingContext';

const LoginCheck = ({ children }) => {
 const {validateAdminLogin,setApiLoading,apiLoading} = useApiLoading();

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    
    const authenticate = async () => {
      try {
        await validateAdminLogin();
        console.log('validate',validateAdminLogin)
        console.log('mynewlocalstrage', localStorage);
        setLoading(false);
      } catch (error) {
        console.log('validate',validateAdminLogin)
        console.error(error.message);
        navigate('/admin-login');
      }
    };

    authenticate();
  }, [navigate]);
  
  if (loading) {
    return <div>
      <div className="flex w-full justify-center items-center h-20">
        <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
      </div>
    </div>;
  }

  return children;
};

export default LoginCheck;
