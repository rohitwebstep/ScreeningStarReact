import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApiLoadingBranch } from '../BranchApiLoadingContext';

const BranchLoginCheck = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();
 

  useEffect(() => {
    const authenticate = async () => {
      try {
        await validateBranchLogin();
        setLoading(false);
      } catch (error) {
        console.error(error.message);
        navigate('/userLogin');
      }
    };

    authenticate();
  }, [navigate]);

  if (loading) {
    return (
      <div>
        <div className="flex w-full justify-center items-center h-20">
          <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
      </div>
    );
  }

  return children;
};

export default BranchLoginCheck;
