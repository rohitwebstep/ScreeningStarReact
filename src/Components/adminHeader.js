import React, { useState, useContext , useEffect, useRef, useCallback } from "react";
import "../App.css";
import Modal from "react-modal";
import { GrServices } from "react-icons/gr";
import { useNavigate } from "react-router-dom";
import { } from "react-icons/fc";
import { FaHome, FaBars, FaUserTie } from "react-icons/fa";
import { RiArrowRightWideLine } from "react-icons/ri";
import Logo from "../imgs/track-master2.png";
import { IoNotifications } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import {
  FaUser,
  FaFileInvoice,
  FaClipboardList,
  FaUserShield,
  FaSignOutAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useSidebarContext } from './SidebarContext';
import { MobileContext } from "./MobileContext";
Modal.setAppElement("#root");

const AdminHeader = () => {
const { isMenuOpen ,setIsMenuOpen } = useContext(MobileContext);

  const [isSignoutLoading, setIsSignoutLoading] = useState(false);
  localStorage.setItem("isBranchExist", 'no');
  const { handleSectionClick, activeTab, sectionTabs, setActiveTab, setSectionTabs } = useSidebarContext();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [innerDropdowns, setInnerDropdowns] = useState({});
  const [profilePic, setProfilePic] = useState({});
  const [tatDelayNotifications, setTatDelayNotifications] = useState([]);
  const [applicationNotifications, setApplicationNotifications] = useState([]);
  const [bulkUploadsNotifications, setBulkUploadsNotifications] = useState([]);
  const notificationRef = useRef(null);
  const myAccountRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState("newApplications");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMyAccountOpen, setIsMyAccountOpen] = useState(false);
  const storedToken = localStorage.getItem("token");
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [roleByLocal, setRoleByLocal] = useState(null);

  useEffect(() => {
    // Get the role from localStorage and set it into the state
    const storedRole = JSON.parse(localStorage.getItem('admin'))?.role;
    setRoleByLocal(storedRole);
  }, []);

  const handleSignout = async () => {
    try {
      setIsSignoutLoading(true);
      const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
      const storedToken = localStorage.getItem("_token");

      if (!storedToken || !adminId) {
        console.error('No token or admin_id found');
        setIsSignoutLoading(false); // Reset loading state
        return;
      }

      const requestOptions = {
        method: 'GET',
        redirect: 'follow',
      };

      const url = `https://api.screeningstar.co.in/admin/logout?admin_id=${adminId}&_token=${storedToken}`;
      const response = await fetch(url, requestOptions);

      if (response.ok) {
        localStorage.removeItem("sectiontabJson");
        localStorage.removeItem("subMenu");
        localStorage.removeItem("_token");
        localStorage.removeItem("admin");
        navigate('/admin-login');
      } else {
        const errorMessage = await response.text();
        console.error('Logout failed:', errorMessage);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      setIsSignoutLoading(false); // Ensure loading state is reset
    }
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown((prev) => (prev === dropdown ? null : dropdown));
    if (openDropdown !== dropdown) {

      setInnerDropdowns({});
    }
  };

  const toggleInnerDropdown = (dropdown) => {
    setInnerDropdowns((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const confirmSignout = () => {
    handleSignout();
    closeModal();

  };

  const toggleNotificationPopup = useCallback(async () => {
    // Toggle popup after successful API call
    setIsNotificationOpen((prev) => !prev);
    if (!isNotificationOpen) {
      // Retrieve admin ID and multiply by 1.5
      const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
      if (!adminId) {
        console.error("Admin ID not found");
        return;
      }
      const multipliedAdminId = adminId * 1.5;

      // Convert to Base64
      const encodedAdminId = btoa(multipliedAdminId.toString());

      try {
        // Make the GET request without a body
        const response = await fetch(`https://api.screeningstar.co.in/notification?YWRtaW5faWQ=${encodedAdminId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse response as JSON
        const result = await response.json();
        console.log(result);
        let newTatDelayNotifications;
        let newApplicationNotifications;
        let newBulkUploadsNotifications;
        // Check if the response is valid and contains the data you need
        if (result.status && result.data.tatDelayList) {
          newTatDelayNotifications = result.data.tatDelayList.flatMap((customer) =>
            customer.branches.flatMap((branch) =>
              branch.applications
                .filter((application) => application.days_out_of_tat > 0)
                .map((application) => ({
                  applicationName: application.application_name,
                  customerName: customer.customer_name,
                  daysOutOfTat: application.days_out_of_tat,
                  applicationID: application.application_id,
                  isPriority: application.is_priority,
                }))
            )
          );
        }
        if (result.status && result.data.newApplications) {
          newApplicationNotifications = result.data.newApplications.flatMap((customer) =>
            customer.branches.flatMap((branch) =>
              branch.applications
                .map((application) => ({
                  applicationName: application.client_applicant_name,
                  customerName: customer.customer_name,
                  daysOutOfTat: application.days_out_of_tat,
                  applicationID: application.application_id,
                  isPriority: application.is_priority,
                }))
            )
          );
        }

        if (result.status && result.data.newBulkUploads) {
          newBulkUploadsNotifications = result.data.newBulkUploads.flatMap((customer) =>
            customer.branches.flatMap((branch) =>
              branch.bulks
                .map((bulk) => ({
                  branchName: branch.branch_name,
                  customerName: customer.customer_name,
                  clientSpocName: bulk.client_spoc_name,
                  createdAt: bulk.created_at,
                  zip: bulk.zip,
                }))
            )
          );
        }
        setTatDelayNotifications(newTatDelayNotifications);
        setApplicationNotifications(newApplicationNotifications);
        setBulkUploadsNotifications(newBulkUploadsNotifications);

      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
  }, [isNotificationOpen]);
  const toggleMyAccountPopup = useCallback(async () => {
    setIsMyAccountOpen((prev) => !prev);
  }, [isMyAccountOpen]);


  // Handle click outside dropdown to close it
  useEffect(() => {

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null); // Close outer dropdown if click is outside
      }
      else if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false); // Close the notification popup
      }
      else if (myAccountRef.current && !myAccountRef.current.contains(event.target)) {
        setIsMyAccountOpen(false); // Close the notification popup
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const admin = JSON.parse(localStorage.getItem('admin'));
  const adminName = admin ? admin.name : null;

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };


  const handlePersonalClick = (linkName) => {

    localStorage.setItem('SideBarName', linkName)
    localStorage.removeItem('activeTab');

    localStorage.removeItem('openDropdown');

    if (linkName === 'Leave Management') {
      localStorage.setItem('subMenu', 'leaveManagement');
    } else {
      localStorage.setItem('subMenu', linkName);
    }
    handleSectionClick(linkName);
  };



  return (

    <nav className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 shadow-md">
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="modal absolute bg-white p-5 Z-999 py-16 px-2  border shadow-[7px_5px_32px_9px_rgba(0,0,0,0.5)] w-[30%] m-auto shadow-15 top-[200px] right-[0px] left-0 text-center"
        overlayClassName="fixed inset-0  flex items-center justify-center"
      >

        <h2 className="text-3xl font-bold">Confirm Sign Out</h2>
        <p className="text-lg">Are you sure you want to sign out?</p>
        <div className="flex justify-center mt-6 space-x-4">
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded"
          >
            Cancel
          </button>
          <button
            onClick={confirmSignout}
            className={`bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded ${isSignoutLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSignoutLoading}
          >
            {isSignoutLoading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </Modal>

      <div className=" mx-auto md:px-10 px-4 py-4">
        <div className="flex  md:flex-row justify-between items-center">
          <div className="lg:hidden">
            <button onClick={handleMenuToggle} className="text-[#4d606b]">
              <FaBars className="text-xl" />
            </button>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" onClick={() => handleSectionClick('Home')} className="text-[#4d606b] hidden lg:block">
              <FaHome className="text-3xl hover:text-[#004391] transition duration-200" />
            </Link>
            <div className="border border-black rounded-md p-2 shadow-md">
              <img src={Logo} alt="Logo" className="md:h-10 h-4 w-auto" />
            </div>
            <span className="text-xs md:text-lg hidden lg:block font-medium text-[#4d606b]">Hi {adminName}</span>

          </div>




          <div className="md:mt-4 mt-0 flex items-center md:gap-10 gap-4">

            <div className="relative">
              {(() => {
                const adminImage = JSON.parse(localStorage.getItem("admin"))?.profile_picture;
                return adminImage ? (
                  <img
                    src={`${adminImage}`}
                    alt="Profile"
                    className=" md:w-10 w-6  md:h-10 h-6 rounded-full cursor-pointer"
                    onClick={toggleMyAccountPopup}
                  />
                ) : (
                  <CgProfile
                    className="text-2xl text-gray-600 hover:text-[#004391] transition duration-200 cursor-pointer"
                    onClick={toggleMyAccountPopup}
                  />
                );
              })()}

              {isMyAccountOpen && (
                <div
                  ref={myAccountRef}
                  className="absolute md:right-0 right-[-87px] mt-2  w-48 lg:w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
                >
                  <h3 className="text-lg z-99999 font-medium text-gray-700">My Account</h3>
                  <ul className="mt-2 space-y-2">
                    <li
                      className="text-sm text-gray-600 cursor-pointer"
                      onClick={() => navigate('/admin-update-password')}
                    >
                      Update Password
                    </li>
                    <li
                      className="text-sm text-red-600 cursor-pointer"
                      onClick={confirmSignout}
                    >
                      SIGN OUT
                    </li>
                    
                  </ul>
                </div>

              )}
            </div>

            <div className="relative ">
              <IoNotifications
                className="md:text-2xl text-lg text-gray-600 hover:text-[#004391]  transition duration-200 cursor-pointer"
                onClick={toggleNotificationPopup}
              />
              {isNotificationOpen && (
                <div
                  ref={notificationRef}
                  className="absolute right-0 mt-2 w-96 bg-white rounded-lg  shadow-lg border border-gray-200 p-4 z-999"
                >
                  <h3 className="text-lg font-medium text-gray-700">Notifications</h3>

                  {/* Tabs for switching between New Applications and Out of TAT */}
                  <div className="flex space-x-4 border-b pb-2 mb-4">
                    <button
                      className={`text-sm font-medium ${activeNotificationTab === "newApplications"
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-gray-500"
                        }`}
                      onClick={() => setActiveNotificationTab("newApplications")}
                    >
                      New Applications
                    </button>
                    <button
                      className={`text-sm font-medium ${activeNotificationTab === "outOfTAT"
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-gray-500"
                        }`}
                      onClick={() => setActiveNotificationTab("outOfTAT")}
                    >
                      Out of TAT
                    </button>

                    <button
                      className={`text-sm font-medium ${activeNotificationTab === "newBulks"
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-gray-500"
                        }`}
                      onClick={() => setActiveNotificationTab("newBulks")}
                    >
                      New Bulk Files
                    </button>
                  </div>

                  {activeNotificationTab === "outOfTAT" && (
                    <ul className="mt-2 space-y-2">
                      {tatDelayNotifications.length > 0 ? (
                        tatDelayNotifications.map((notification, index) => {
                          console.log(notification); // Debugging: Log notification object to check the structure

                          // Manually setting priority to true if isPriority equals "1"
                          const isPriority = notification.isPriority && notification.isPriority == "1" ? true : false;

                          return (
                            <li
                              key={index}
                              className={`text-sm text-gray-600 p-2 border-b last:border-b-0 ${isPriority ? "border-green-500" : "border-gray-200"
                                }`}
                            >
                              <div className="flex justify-between items-center">
                                <span>
                                  <strong>{`${notification.applicationName}`}</strong>
                                  {` (`}
                                  <strong>{`${notification.applicationID}`}</strong>
                                  {`) for `}
                                  <em>{`${notification.customerName}`}</em>
                                  {` is ${notification.daysOutOfTat} days out of TAT.`}
                                </span>

                                {isPriority && (
                                  <span className="text-green-500 font-bold">Priority</span>
                                )}

                              </div>
                            </li>
                          );
                        })
                      ) : (
                        <li className="text-sm text-gray-600">No new notifications </li>
                      )}
                    </ul>
                  )}
                  {activeNotificationTab === "newApplications" && (
                    <ul className="mt-2 space-y-2 overflow-y-scroll max-h-96 ">
                      {applicationNotifications.length > 0 ? (
                        applicationNotifications.map((notification, index) => {
                          console.log(notification); // Debugging: Log notification object to check the structure

                          // Manually setting priority to true if isPriority equals "1"
                          const isPriority = notification.isPriority && notification.isPriority == "1" ? true : false;

                          return (
                            <li
                              key={index}
                              className={`text-sm text-gray-600 p-2   border-b last:border-b-0 ${isPriority ? "border-green-500" : "border-gray-200"
                                }`}
                            >
                              <div className="flex justify-between  items-center">
                                <span>
                                  {`New Application of `}
                                  <strong>{`${notification.applicationName}`}</strong>
                                  {` (`}
                                  <strong>{`${notification.applicationID}`}</strong>
                                  {`) from `}
                                  <em>{`${notification.customerName}`}</em>
                                </span>

                                {isPriority && (
                                  <span className="text-green-500 font-bold">Priority</span>
                                )}
                              </div>
                            </li>
                          );
                        })
                      ) : (
                        <li className="text-sm text-gray-600">No new notifications </li>
                      )}
                    </ul>
                  )}

                  {activeNotificationTab === "newBulks" && (
                    <ul className="mt-2 space-y-2 overflow-y-scroll max-h-96">
                      {bulkUploadsNotifications.length > 0 ? (
                        bulkUploadsNotifications.map((notification, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 p-2 border-b last:border-b-0 border-gray-200"
                          >
                            <div className="flex justify-between items-center">
                              <span>
                                {`Bulk file uploaded by `}
                                <strong>{notification.branchName}</strong>
                                {` (`}
                                <strong>{notification.customerName}</strong>
                                {`) under `}
                                <em>{notification.clientSpocName}</em>
                                {` on `}
                                <strong>{notification.createdAt}</strong>.
                              </span>
                              <button
                                type="button"
                                className="ml-4 text-blue-500 hover:underline"
                                onClick={() => {
                                  if (notification.zip) {
                                    const url = new URL(notification.zip);
                                    const baseFileName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
                                    const link = document.createElement('a');
                                    link.href = notification.zip;
                                    link.download = baseFileName;
                                    link.click();
                                  } else {
                                    alert('No ZIP file URL available.');
                                  }
                                }}
                              >
                                Download ZIP
                              </button>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-600">No new notifications</li>
                      )}
                    </ul>
                  )}


                </div>
              )}


            </div>


           
          {(roleByLocal == 'sub_user' || roleByLocal == 'user') && (
        <Link
          to="/admin-LeaveManagement"
          className="md:text-xl text-sm text-gray-600 hover:text-[#004391] transition duration-200 cursor-pointer"
          onClick={() => handlePersonalClick('Personal Management')}
        >
          <div className="p-3 m-auto text-center">
            <span className="block md:text-sm text-sm text-[#004391] font-semibold">LEAVE</span>
            <span className="block md:text-xs text-xs text-gray-500 ">MANAGEMENT</span>
          </div>
        </Link>
      )}




            <button
              onClick={openModal}
              className={`border border-red-600  hidden lg:block text-red-600 font-semibold py-2 px-6 rounded transition duration-200 ${isSignoutLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600 hover:text-white'
                }`}
              disabled={isSignoutLoading}
            >
              {isSignoutLoading ? 'Signing Out...' : 'Sign Out'}
            </button>

          </div>
        </div>
      </div>
    </nav >


  );
};

export default AdminHeader;
