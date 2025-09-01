import React, { useEffect } from 'react';
import adminBG from "../../imgs/admin-dashboard.jpeg";
import { useApiLoading } from '../ApiLoadingContext';

const Dashboard = () => {
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

  // useEffect(() => {
  //   validateAdminLogin();
  // }, [validateAdminLogin]);
  return (
    <div className='text-center  w-full h-full md:pb-10  md:pr-10 md:mr-10'
    >
      <div className='text-center admindesktopNEG bg-cover w-full h-full flex items-center justify-center bg-center pr-10 mr-10'
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
