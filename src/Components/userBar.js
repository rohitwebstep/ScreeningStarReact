import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser,FaUserTie, FaFileInvoice, FaClipboardCheck , FaUserShield, FaSignOutAlt,FaTicketAlt,FaChartBar,FaCogs ,FaTasks ,FaLayerGroup    } from "react-icons/fa";
import { GrServices } from "react-icons/gr";
import Modal from "react-modal";
import "../App.css";
import { useSidebarContext } from './SidebarContext'; // Correct named import and fix typo
import { useApiLoadingBranch } from './BranchApiLoadingContext';

Modal.setAppElement("#root");

const UserBar = () => {
  const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();
  localStorage.setItem("isBranchExist", 'yes');
  const { handleSectionClick } = useSidebarContext();
  const [activeTab, setActiveTab] = useState(''); // Track the active menu item

  const [openDropdown, setOpenDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const storedToken = localStorage.getItem("token");
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleSignout = async () => {
    try {
      if (!storedToken) {
        console.error("No token found");
        return;
      }

      const response = await fetch("https://screeningstar.onrender.com/Screeningstar/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.ok) {
        localStorage.clear();
        navigate("/admin-login");
      } else {
        const errorMessage = await response.text();
        console.error("Logout failed:", errorMessage);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown((prev) => (prev === dropdown ? null : dropdown));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const confirmSignout = () => {
    handleSignout();
    closeModal();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClick = (linkName) => {
    localStorage.setItem('SideBarName', linkName)
    localStorage.removeItem('activeTab');
    localStorage.removeItem('openDropdown');
    setOpenDropdown(null)


    if (linkName === 'CLIENT MANAGER') {
      localStorage.setItem('subMenu', 'clientManager');
    } else if (linkName === 'CANDIDATE MANAGER') {
      localStorage.setItem('subMenu', 'candidateManager');
    } else if (linkName === 'CREATE USERS') {
      localStorage.setItem('subMenu', 'createUsers');
    } else if (linkName === 'VERIFICATION STATUS') {
      localStorage.setItem('subMenu', 'verificationStatus');
    } else if (linkName === 'MASTER DASHBOARD') {
      localStorage.setItem('subMenu', 'masterDashboard');
    }else if (linkName === 'CREATE TICKETS') {
      localStorage.setItem('subMenu', 'createTickets');
    }else if (linkName === 'BULK APPLICATION') {
      localStorage.setItem('subMenu', 'bulkApplication');
    }else if (linkName === 'CHECKLIST AND ESCALATION MATRIX') {
      localStorage.setItem('subMenu', 'checklistAndEscalation');
    }else if (linkName === 'API INTEGRATION') {
      localStorage.setItem('subMenu', 'apiIntegration');
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    
    handleSectionClick(linkName); // Call existing function
  };


  return (
    <nav className="bg-white h-full">
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="modal absolute bg-white p-5 border shadow-lg w-[40%] m-auto text-center"
        overlayClassName="overlay"
      >
        <h2 className="text-lg font-bold">Confirm Sign Out</h2>
        <p>Are you sure you want to sign out?</p>
        <div className="flex justify-center mt-4 w-full">
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
          >
            Cancel
          </button>
          <button
            onClick={confirmSignout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>
      </Modal>

      <div className="container flex flex-col mx-auto py-4">
        <ul className="flex flex-col  max-w-[250px] space-y-2">
          <li className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition  duration-300 transform ease-in-out ${activeTab === 'CLIENT MANAGER' || localStorage.getItem('SideBarName') === 'CLIENT MANAGER'
              ? 'activeSubmenu bg-[#c1dff2] text-gray-800 scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/user-ClientManager"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'CLIENT MANAGER' || localStorage.getItem('SideBarName') === 'CLIENT MANAGER' ? 'font-semibold' : ''} ${apiLoadingBranch ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoadingBranch) {
                  e.preventDefault(); // Prevent navigation if apiLoadingBranch is true
                } else {
                  handleClick('CLIENT MANAGER');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <FaUser className="text-4xl m-auto" />
                CLIENT MANAGER
              </div>
            </Link>
          </li>
          <li className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition duration-300 transform ease-in-out ${activeTab === 'CANDIDATE MANAGER' || localStorage.getItem('SideBarName') === 'CANDIDATE MANAGER'
              ? 'activeSubmenu bg-[#c1dff2] text-gray-800 scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/user-candidateManager"
            className={` flex flex-wrap justify-center items-center p-2 ${activeTab === 'CANDIDATE MANAGER' || localStorage.getItem('SideBarName') === 'CANDIDATE MANAGER'? 'font-semibold': ''} ${apiLoadingBranch ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoadingBranch) {
                  e.preventDefault(); // Prevent navigation if apiLoadingBranch is true
                } else {
                  handleClick('CANDIDATE MANAGER')
                }
              }}
            >
              <div className="p-2 m-auto text-center  " >
                <FaUserTie className="text-4xl m-auto" />
                CANDIDATE MANAGER
              </div>
            </Link>
          </li>
          <li className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition duration-300 transform ease-in-out ${activeTab === 'CREATE USERS' || localStorage.getItem('SideBarName') === 'CREATE USERS'
              ? 'activeSubmenu bg-[#c1dff2] text-gray-800 scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/user-create"
            className={` flex flex-wrap justify-center items-center p-2 ${activeTab === 'CREATE USERS' || localStorage.getItem('SideBarName') === 'CREATE USERS' ? 'font-semibold': ''} `}
              onClick={(e) => {
                  handleClick('CREATE USERS')
          
              }}
            >
              <div className="p-3 m-auto text-center  " >
                <FaFileInvoice className="text-4xl m-auto" />
                CREATE USERS
              </div>
            </Link>
          </li> 
          <li className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition duration-300 transform ease-in-out ${activeTab === 'VERIFICATION STATUS' || localStorage.getItem('SideBarName') === 'VERIFICATION STATUS'
              ? 'activeSubmenu bg-[#c1dff2] text-gray-800 scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/user-verificationStatus"
            className={` flex flex-wrap justify-center items-center p-2 ${activeTab === 'VERIFICATION STATUS' || localStorage.getItem('SideBarName') === 'VERIFICATION STATUS'? 'font-semibold': ''} ${apiLoadingBranch ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoadingBranch) {
                  e.preventDefault(); // Prevent navigation if apiLoadingBranch is true
                } else {
                  handleClick('VERIFICATION STATUS');
                }
              }}
            >
              <div className="p-2 m-auto text-center  " >
                <FaClipboardCheck  className="text-4xl m-auto" />
                VERIFICATION STATUS
              </div>
            </Link>
          </li>

          <li className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition duration-300 transform ease-in-out ${activeTab === 'MASTER DASHBOARD' || localStorage.getItem('SideBarName') === 'MASTER DASHBOARD'
              ? 'activeSubmenu bg-[#c1dff2] text-gray-800 scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/user-MasterDashboard"
            className={` flex flex-wrap justify-center items-center p-2 ${activeTab === 'MASTER DASHBOARD' || localStorage.getItem('SideBarName') === 'MASTER DASHBOARD'? 'font-semibold': ''} ${apiLoadingBranch ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoadingBranch) {
                  e.preventDefault(); // Prevent navigation if apiLoadingBranch is true
                } else {
                  handleClick('MASTER DASHBOARD');
                }
              }}
            >
              <div className="p-2 m-auto text-center  " >
                <FaChartBar   className="text-4xl m-auto" />
                MASTER DASHBOARD
              </div>
            </Link>
          </li>
          <li className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition duration-300 transform ease-in-out ${activeTab === 'CREATE TICKETS' || localStorage.getItem('SideBarName') === 'CREATE TICKETS'
              ? 'activeSubmenu bg-[#c1dff2] text-gray-800 scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/user-createTickets"
            className={` flex flex-wrap justify-center items-center p-2 ${activeTab === 'CREATE TICKETS' || localStorage.getItem('SideBarName') === 'CREATE TICKETS'? 'font-semibold': ''} ${apiLoadingBranch ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoadingBranch) {
                  e.preventDefault(); // Prevent navigation if apiLoadingBranch is true
                } else {
                  handleClick('CREATE TICKETS');
                }
              }}
            >
              <div className="p-2 m-auto text-center  " >
                <FaTicketAlt className="text-4xl m-auto" />
                CREATE TICKETS
              </div>
            </Link>
          </li>

          <li className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition duration-300 transform ease-in-out ${activeTab === 'BULK APPLICATION' || localStorage.getItem('SideBarName') === 'BULK APPLICATION'
              ? 'activeSubmenu bg-[#c1dff2] text-gray-800 scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/user-bulkApplication"
            className={` flex flex-wrap justify-center items-center p-2 ${activeTab === 'BULK APPLICATION' || localStorage.getItem('SideBarName') === 'BULK APPLICATION'? 'font-semibold': ''} ${apiLoadingBranch ? 'cursor-not-allowed opacity-50' : ''}`}
             
              onClick={(e) => {
                if (apiLoadingBranch) {
                  e.preventDefault(); // Prevent navigation if apiLoadingBranch is true
                } else {
                  handleClick('BULK APPLICATION');
                }
              }}
            > 
              <div className="p-2 m-auto text-center  " >
                <FaLayerGroup  className="text-4xl m-auto" />
                BULK APPLICATION
              </div>
            </Link>
          </li>
          <li className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition duration-300 transform ease-in-out ${activeTab === 'CHECKLIST AND ESCALATION MATRIX' || localStorage.getItem('SideBarName') === 'CHECKLIST AND ESCALATION MATRIX'
              ? 'activeSubmenu bg-[#c1dff2] text-gray-800 scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/user-checklistAndEscalation"
            className={` flex flex-wrap justify-center items-center p-2 ${activeTab === 'CHECKLIST AND ESCALATION MATRIX' || localStorage.getItem('SideBarName') === 'CHECKLIST AND ESCALATION MATRIX'? 'font-semibold': ''} ${apiLoadingBranch ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoadingBranch) {
                  e.preventDefault(); // Prevent navigation if apiLoadingBranch is true
                } else {
                  handleClick('CHECKLIST AND ESCALATION MATRIX');
                }
              }}
            > 
              <div className="p-2 m-auto text-center  " >
                <FaTasks   className="text-4xl m-auto" />
                <div className="text-sm">
                  CHECKLIST AND ESCALATION MATRIX
                </div>
                </div>
            </Link>
          </li>
          <li className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition duration-300 transform ease-in-out ${activeTab === 'API INTEGRATION' || localStorage.getItem('SideBarName') === 'API INTEGRATION'
              ? 'activeSubmenu bg-[#c1dff2] text-gray-800 scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/user-ApiIntegration"
            className={` flex flex-wrap justify-center items-center p-2 ${activeTab === 'API INTEGRATION' || localStorage.getItem('SideBarName') === 'API INTEGRATION'? 'font-semibold': ''} ${apiLoadingBranch ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoadingBranch) {
                  e.preventDefault(); // Prevent navigation if apiLoadingBranch is true
                } else {
                  handleClick('API INTEGRATION');
                }
              }}
            > 
              <div className="p-3 m-auto text-center  " >
                <FaCogs  className="text-4xl m-auto" />
                <div className="text-sm">
                  API INTEGRATION
                </div>
                </div>
            </Link>
          </li>
            {/* <li className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] ${activeTab === 'SEE MORE' ? 'hover:bg-[#2c81ba] bg-[#2c81ba] text-white' : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-[#2c81ba] hover:text-white'} transition duration-300`}>
              <Link
                to="/user-MasterDashboard"
              className={` flex flex-wrap justify-center items-center p-2 ${activeTab === 'Credentials' || localStorage.getItem('SideBarName') === 'Credentials'? 'font-semibold': ''}`}
                onClick={() => handleClick('SEE MORE')}
              >
                <div className="p-2 m-auto text-center" >
                  <FaSignOutAlt  className="text-4xl m-auto" />
                  SEE MORE
                </div>
              </Link>
            </li>                 */}
          {/* Sign Out Button */}

        </ul>
      </div>
    </nav>
  );
};

export default UserBar;
