import React from 'react';
import adminBG from "../../imgs/admin-dashboard.jpeg";
import { useApiLoading } from '../ApiLoadingContext';

const Dashboard = () => {
  const {validateAdminLogin,setApiLoading,apiLoading} = useApiLoading();

  return (
    <div className='text-center  w-full h-full pb-10  pr-10 mr-10'  
    >
    <div className='text-center bg-cover w-full h-full flex items-center justify-center bg-center pr-10 mr-10'  
    style={{
     backgroundImage: `url(${adminBG})`,
   }}>
    
  
      <h1 className='text-5xl font-bold py-14'
      style={{
        textShadow: '9px 10px 10px #fff',
      }}>Welcome To ScreeningStar</h1>
      </div>
    </div>
  );
}

export default Dashboard;
