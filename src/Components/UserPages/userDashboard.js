import React from 'react'
import adminBG from "../../imgs/user-dashboard.jpeg";

const userDashboard = () => {




  return (
    <div className='text-center  w-full h-full pb-10  pr-10 mr-10' >
      <div className='text-center bg-cover w-full h-full flex items-center justify-center bg-center pr-10 mr-10'
        style={{
          backgroundImage: `url(${adminBG})`,
        }}>
        <h1
          className="text-7xl font-bold py-14"
          style={{
            textShadow: '9px 10px 10px #fff',
          }}
        >
          This Is User Dashboard
        </h1>
      </div>
    </div>
  )
}

export default userDashboard
