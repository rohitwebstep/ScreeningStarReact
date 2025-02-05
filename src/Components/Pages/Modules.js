import React from 'react'
import { useNavigate } from "react-router-dom";

const Modules = () => {
     const navigate = useNavigate();
      const handleView = () => {
          alert('Hello');
          navigate('/admin-ViewModules'); // Navigate to the desired route
      };
  
  return (
    <div className="w-full bg-[#c1dff2] border border-black overflow-hidden">

      <div className="space-y-4 py-6 px-4 md:py-[30px] md:px-[51px] bg-white">

        <table className={`min-w-full border-collapse border border-black`}>
          <thead>
            <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b] text-left">
              <th className="uppercase border border-black px-4 py-2 text-center">SI</th>
              <th className="uppercase border border-black px-4 py-2">Module Name</th>
              <th className="uppercase border border-black px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr >
              <td className="border border-black px-4 py-2 text-center">`1`</td>
              <td className="border border-black px-4 py-2">GENERATE REPORT</td>
              <td className="border border-black px-4 py-2 text-center">
                <button
                  className="ml-2 p-2 px-4 font-bold text-white bg-green-500 hover:bg-green-600 rounded-md"
                  onClick={handleView}
                >
                  VIEW
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Modules