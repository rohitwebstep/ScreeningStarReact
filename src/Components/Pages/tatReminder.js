import React, { useCallback, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import Swal from 'sweetalert2';

const TATReminder = () => {
  const navigate = useNavigate();
       const {validateAdminLogin,setApiLoading,apiLoading} = useApiLoading();

  
  const [showAllFields, setShowAllFields] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableData, setTableData] = useState([]);
  const [applicationHierarchy, setApplicationHierarchy] = useState([]);
  const [newData, setNewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);


  const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
  const storedToken = localStorage.getItem("_token");

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!storedToken) {
      setError("Token not found");
      setLoading(false);
      setApiLoading(false);

      return;
    }
    setApiLoading(true);

    setLoading(true);

    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/tat-delay/list?admin_id=${admin_id}&_token=${storedToken}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${storedToken}` },
        }
      );
      const newToken = response.token || response._token || storedToken ;
      if (newToken) {
        console.log("token is saerd" ,newToken)
          localStorage.setItem("_token", newToken);
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      setTableData(result.tatDelays.holidays || []);
      setApplicationHierarchy(result.tatDelays.applicationHierarchy || []);

      setNewData(result.tatDelays.applicationHierarchy);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setApiLoading(false);
      setLoading(false);
    }
  }, [storedToken, admin_id]);

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      try { 
        if (apiLoading == false) {
        await validateAdminLogin();
        await fetchData();
        }
      } catch (error) {
        console.error(error.message);
        navigate('/admin-login');
      }
    };

    initialize();
  }, [navigate, fetchData]);

  // Handle search functionality
  const filteredData = applicationHierarchy.flatMap((hierarchy) =>
    hierarchy.branches.flatMap((branch) =>
      branch.applications
        .filter((application) =>
          application.application_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          application.application_id?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((application) => ({
          ...application,
          branch_id: branch.branch_id,
          customer_id: hierarchy.customer_id,
        }))
    )
  );

  console.log('filteredData---', filteredData)
  // Toggle between showing all fields or only the first 6
  const toggleFields = () => setShowAllFields(!showAllFields);

  // Export table to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TAT Reminder');
    XLSX.writeFile(wb, 'TAT_Reminder.xlsx');
  };

  // Format date utility
  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return String(dateString);
    }
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits for day
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };


  const rowsPerPage = 10; // Number of rows per page

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  // Loader component
  const Loader = () => (
    <div className="flex w-full justify-center items-center h-20">
      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
    </div>
  );
  const handleApplicationDelete = (customerid, applicationId) => {
    // Show confirmation dialog first
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // If user confirms, proceed with deletion
        setDeleteLoading(true);
        setActiveId(applicationId);
        const formdata = new FormData();

        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');
        const requestOptions = {
          method: "DELETE",
          body: formdata,
          redirect: "follow"
        };
        const url = `https://api.screeningstar.co.in/tat-delay/delete-application?customer_id=${customerid}&admin_id=${adminId}&_token=${token}&application_id=${applicationId}`;
        fetch(url, requestOptions)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((result) => {
            console.log("Highlight success:", result);
            if (result.status) {
              Swal.fire('Success', result.message, 'success');
              fetchData(); // Refresh the data after success
            } else {
              Swal.fire('Error', result.message, 'error');
            }
          })
          .catch((error) => {
            console.error("Error Deleting application:", error);

            // Extract or set dynamic error message based on the error
            const errorMessage = error.message.includes('HTTP error')
              ? `Failed to Delete application. Server returned status ${error.message.split(': ')[1]}`
              : 'Failed to Delete application. Please try again.';

            Swal.fire('Error', errorMessage, 'error');
          })
          .finally(() => {
            setDeleteLoading(false);
            setActiveId(null);
          });
      } else {
        // If user cancels, show a cancel message or simply do nothing
        Swal.fire('Cancelled', 'The application was not deleted.', 'info');
      }
    });
  };

  const handleMasterTrackerClick = (ClientId, BranchId, isDataQc) => {
    if (isDataQc == 1) {
      navigate(`/admin-generate-report?applicationId=${ClientId}&branchid=${BranchId}&from-tat=1`);
    } else if (isDataQc == 0) {
      navigate(`/admin-DataGenerateReport?applicationId=${ClientId}&branchid=${BranchId}&from-tat=1`);
    }
  };


  return (

    <div className="bg-[#c1dff2]">
      <div className="bg-white border border-black p-12 w-full mx-auto" id={``}>
        <div className="mb-4 text-center">
        </div>

        <div className="mb-4 flex justify-between">
          <button
            onClick={exportToExcel}
            className="bg-green-500 text-white rounded px-4 py-2 hover:scale-105 hover:bg-green-600 border"
          >
            Export to Excel
          </button>
          <input
            type="text"
            placeholder="Search.."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-1/3"
          />
        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full border-collapse border border-black rounded-lg overflow-scroll whitespace-nowrap">
            <thead className="rounded-lg">
              <tr className="bg-[#c1dff2] text-[#4d606b] rounded-lg uppercase">
                <th className="border border-black px-4 py-2">SL</th>
                <th className="border border-black px-4 py-2">TAT Days</th>
                <th className="border border-black px-4 py-2">Initiation Date</th>
                <th className="border border-black px-4 py-2">Reference Id</th>
                <th className="border border-black px-4 py-2">Name of the Employee</th>
                <th className="border border-black px-4 py-2">Exceeded Days</th>
                <th className="border border-black px-4 py-2">First Level Insufficiency Remarks</th>
                <th className="border border-black px-4 py-2">First Insuff Date</th>
                <th className="border border-black px-4 py-2">First Insuff Cleared</th>
                <th className="border border-black px-4 py-2">Second Level Insufficiency Remarks</th>
                <th className="border border-black px-4 py-2">Second Insuff Date</th>
                <th className="border border-black px-4 py-2">Second Insuff Cleared</th>
                <th className="border border-black px-4 py-2">Third Level Insufficiency Remarks</th>
                <th className="border border-black px-4 py-2">Third Insuff Date</th>
                <th className="border border-black px-4 py-2">Third Insuff Cleared</th>
                <th className="border border-black px-4 py-2">Remarks & Reason for Delay</th>

              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={20} className="py-4 text-center text-gray-500">
                    <Loader />
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((application, index) => (
                  <tr key={`${application.client_application_id}-${index}`} className="text-center">

                    <td className="border border-black px-4 py-2">{index + 1}</td>
                    <td className="border border-black px-4 py-2">{application.days_out_of_tat}</td>
                    <td className="border border-black px-4 py-2">
                      {application.application_created_at
                        ? new Date(application.application_created_at).toLocaleDateString('en-GB').replace(/\//g, '-')
                        : 'NIL'}
                    </td>
                    <td className="border border-black px-4 py-2">{application.application_id}</td>
                    <td className="border border-black px-4 py-2">{application.application_name}</td>
                    <td className="border border-black px-4 py-2">
                      {application.days_out_of_tat
                        ? new Date(application.days_out_of_tat).toLocaleDateString('en-GB').replace(/\//g, '-')
                        : 'NIL'}
                    </td>
                        <td className="border border-black px-4 py-2">{formatDate(application.first_insufficiency_marks)}</td>
                        <td className="border border-black px-4 py-2">{formatDate(application.first_insuff_date)}</td>
                        <td className="border border-black px-4 py-2">{formatDate(application.first_insuff_reopened_date)}</td>
                        <td className="border border-black px-4 py-2">{formatDate(application.second_insufficiency_marks)}</td>
                        <td className="border border-black px-4 py-2">{formatDate(application.second_insuff_date)}</td>
                        <td className="border border-black px-4 py-2">{formatDate(application.second_insuff_reopened_date)}</td>
                        <td className="border border-black px-4 py-2">{formatDate(application.third_insufficiency_marks)}</td>
                        <td className="border border-black px-4 py-2">{formatDate(application.third_insuff_date)}</td>
                        <td className="border border-black px-4 py-2">{formatDate(application.third_insuff_reopened_date)}</td>
                        <td className="border border-black px-4 py-2">{formatDate(application.delay_reason)}</td>
                        {/* <td className="border border-black px-4 py-2">
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md hover:scale-105"
                            onClick={() =>
                              handleMasterTrackerClick(application.client_application_id, application.branch_id, application.is_data_qc)
                            }
                          >
                            Master Tracker
                          </button>
                        </td> */}
                        {/* <td className="border border-black px-4 py-2">
                          <button
                            className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md ${deleteLoading && activeId === application.client_application_id
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:scale-105"
                              }`}
                            onClick={() => {
                              setDeleteLoading(true);
                              setActiveId(application.client_application_id);
                              handleApplicationDelete(application.customer_id, application.client_application_id);
                            }}
                            disabled={deleteLoading && activeId === application.client_application_id}
                          >
                            {deleteLoading && activeId === application.client_application_id ? "Deleting..." : "Delete"}
                          </button>
                        </td> */} 
                  </tr>
                ))) : (
                <tr>
                  <td colSpan={20} className="border border-black px-4 py-2 text-center">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>

          </table>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TATReminder;
