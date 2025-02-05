import React, { useState, useEffect, useRef, useCallback } from "react";
import "../../App.css";
import Modal from "react-modal";
import { GrServices } from "react-icons/gr";
import { FcBriefcase, FcBarChart, FcPortraitMode, FcUpload, FcConferenceCall, FcNightPortrait, FcCustomerSupport, FcMoneyTransfer, FcBusinessman, FcFile, FcDatabase, FcFolder, FcSalesPerformance, FcInspection, FcDocument, FcServices, FcPackage, FcManager, FcApproval, FcCalendar, FcDataSheet, FcTimeline, FcKey } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { } from "react-icons/fc";
import { FaHome } from "react-icons/fa";
import { RiArrowRightWideLine } from "react-icons/ri";
import Logo from "../../imgs/track-master2.png";
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
import { useSidebarContext } from './../SidebarContext';


Modal.setAppElement("#root");
const UserHeader = () => {

  const { handleSectionClick, activeTab, sectionTabs, setActiveTab, setSectionTabs } = useSidebarContext();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [innerDropdowns, setInnerDropdowns] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const storedToken = localStorage.getItem("branch_token");
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);
  const myAccountRef = useRef(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMyAccountOpen, setIsMyAccountOpen] = useState(false);
  const [tatDelayNotifications, setTatDelayNotifications] = useState([]);
  const [reportReadyNotifications, setReportReadyNotifications] = useState([]);

  const branchtoken = localStorage.getItem("branch_token");
  console.log(`localStorage - `, localStorage);

  let branchData;
  let branchId;

  // Try to parse the branch data, and if it fails or is undefined, remove it from localStorage
  try {
    branchData = JSON.parse(localStorage.getItem("branch"));
    branchId = branchData?.id; // Access the id if branchData is valid
  } catch (error) {
    // If JSON parsing fails, clear branch-related items from localStorage
    console.error("Failed to parse branch data:", error);
    localStorage.removeItem("branch");
    localStorage.removeItem("branch_token");
  }

  if (!branchData || !branchId) {
    // If branchData or branchId is undefined, clear the items
    localStorage.removeItem("branch");
    localStorage.removeItem("branch_token");
  }

  const handleSignout = async () => {
    try {
      if (!branchtoken || !branchId) {
        console.error('No token or admin_id found');
        return;
      }

      const requestOptions = {
        method: 'GET',
        redirect: 'follow',
      };

      const url = `https://api.screeningstar.co.in/branch/logout?branch_id=${branchId}&_token=${branchtoken}`;
      const response = await fetch(url, requestOptions);
      if (response.ok) {
        localStorage.removeItem("sectiontabJson");
        localStorage.removeItem("subMenu");
        localStorage.removeItem("branch_token");
        localStorage.removeItem("branch");
        navigate('/userLogin');
      } else {
        const errorMessage = await response.text();
        console.error('Logout failed:', errorMessage);
      }
    } catch (error) {
      console.error('An error occurred:', error);
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

    setIsNotificationOpen((prev) => !prev);

    if (!isNotificationOpen) {
      // Retrieve admin ID and multiply by 1.5
      const branchId = JSON.parse(localStorage.getItem("branch"))?.id;
      if (!branchId) {
        console.error("Branch ID not found");
        return;
      }

      const multipliedBranchId = branchId * 1.5;

      // Convert to Base64
      const encodedBranchId = btoa(multipliedBranchId.toString());

      try {
        // Make the GET request without a body
        const response = await fetch(`https://api.screeningstar.co.in/branch/notification?YnJhbmNoX2lk=${encodedBranchId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse response as JSON
        const result = await response.json();
        console.log(result);

        // Check if the response is valid and contains the data you need
        if (result.status && result.data) {
          const reportReadyNotifications = result.data.flatMap((customer) =>
            customer.branches.flatMap((branch) =>
              branch.applications
                .filter((application) => application.is_priority) // Filter based on some criteria, e.g., priority
                .map((application) => ({
                  applicationName: application.application_name,
                  customerName: customer.customer_name,
                  reportDate: application.report_date,
                  applicationID: application.application_id,
                  reportGeneratedBy: application.report_generate_by,
                  QCDoneBy: application.qc_done_by,
                  isPriority: application.is_priority,
                }))
            )
          );

          // Set the notifications
          setReportReadyNotifications(reportReadyNotifications);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }

  }, [isNotificationOpen]);



  const toggleMyAccountPopup = useCallback(async () => {
    setIsMyAccountOpen((prev) => !prev);
  }, [isMyAccountOpen]);

  useEffect(() => {

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null); // Close outer dropdown if click is outside
      } else if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false); // Close the notification popup
      } else if (myAccountRef.current && !myAccountRef.current.contains(event.target)) {
        setIsMyAccountOpen(false); // Close the notification popup
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getUTCDate(); // Get the day of the month
    const month = date.toLocaleString('default', { month: 'short' }); // Get the short month name
    const year = date.getUTCFullYear(); // Get the full year
    return `${day} ${month} ${year}`;
  }

  return (

    <nav className="bg-gradient-to-l from-gray-200 to-gray-300 z-999 shadow">
      <Modal

        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Sign Out Confirmation"
        className="modal absolute bg-white p-5 py-16 px-2  border shadow-[7px_5px_32px_9px_rgba(0,0,0,0.5)] w-[30%] m-auto shadow-15 top-[200px] right-[0px] left-0 text-center"
        overlayClassName="fixed inset-0  flex items-center justify-center"
      >
        <h2 className="text-3xl font-bold">Confirm Sign Out</h2>
        <p className="text-lg">Are you sure you want to sign out?</p>
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
      <div className="mx-auto px-10 py-4 flex flex-col">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/user-dashboard" onClick={() => handleSectionClick('Home')} className="text-[#4d606b]">
              <FaHome className="text-3xl hover:text-[#004391] transition duration-200" />
            </Link>
            <div className="border border-black rounded-md p-2 shadow-md">
              <img src={Logo} alt="Logo" className="h-10 w-auto" />
            </div>
            <span className="text-lg font-medium text-[#4d606b]">Hi User...</span>
          </div>



          <div className="mt-4 md:mt-0 flex items-center gap-10">
            <div className="relative">
              {(() => {
                const branchimage = JSON.parse(localStorage.getItem("branch"))?.profile_picture;
                return branchimage ? (
                  <img
                    src={`https://api.screeningstar.co.in/${branchimage}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full cursor-pointer"
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
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
                >
                  <h3 className="text-lg font-medium text-gray-700">My Account</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="text-sm text-gray-600 cursor-pointer" onClick={() => navigate('/user-update-password')}>
                      Update Password
                    </li>

                  </ul>
                </div>
              )}
            </div>
            <div className="relative">
              <IoNotifications
                className="text-2xl text-gray-600 hover:text-[#004391] transition duration-200 cursor-pointer"
                onClick={toggleNotificationPopup}
              />
              {isNotificationOpen && (
                <div
                  ref={notificationRef}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
                >
                  <h3 className="text-lg font-medium text-gray-700">Notifications</h3>

                  <ul className="mt-2 space-y-2">
                    {reportReadyNotifications.length > 0 ? (
                      reportReadyNotifications.map((notification, index) => {
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
                                <strong>{notification.applicationName}</strong>
                                {` (ID: `}
                                <strong>{notification.applicationID}</strong>
                                {`) `}
                                QC by <em>{notification.QCDoneBy}</em>, Report by{" "}
                                <em>{notification.reportGeneratedBy}</em> on{" "}
                                {formatDate(notification.reportDate)}.
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
                </div>
              )}
            </div>
            <button
              onClick={openModal}
              className="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold py-2 px-6 rounded transition duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Sign Out Confirmation */}

    </nav>

  );
};
export default UserHeader;
