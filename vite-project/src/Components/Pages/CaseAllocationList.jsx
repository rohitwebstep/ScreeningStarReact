import React, { useEffect, useState, useCallback, useRef } from 'react';
import Modal from 'react-modal';
import { useApiLoading } from '../ApiLoadingContext';
import * as XLSX from 'xlsx';
import { useClientContext } from "./ClientContext";
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const CaseAllocationList = () => {
  const navigate = useNavigate();
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200];
  const [scopeFilter, setScopeFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [services, setServices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / entriesPerPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalServices, setModalServices] = useState([]);
  const [responseError, setResponseError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setApiLoading(true);

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: "Admin ID or token not found. Please log in.",
      });
      setApiLoading(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/client-allocation/list?admin_id=${admin_id}&_token=${storedToken}`,
        {
          method: "GET",
          redirect: "follow",
        }
      );

      // First check response status
      if (!response.ok) {
        const data = await response.json();
        Swal.fire("Error!", `${data.message}`, "error");
        setResponseError(data.message);

        // Update token if provided
        if (data.token || data._token) {
          localStorage.setItem("_token", data.token || data._token);
        }

        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      // Parse JSON only once
      const result = await response.json();

      // Log the response for debugging
      console.log("API Response:", result);

      // Update token if provided
      if (result.token || result._token) {
        localStorage.setItem("_token", result.token || result._token);
      }

      // Handle response data
      setServicesList(result.data?.services || []);
      setData(result.data?.caseAllocations || []);
      setServices(result.data?.caseAllocations?.service_ids || []);

    } catch (error) {
      console.error("Fetch error:", error);
      Swal.fire({
        icon: "error",
        title: "Fetch Error",
        text: "Failed to fetch. Please try again later.",
      });
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  }, []);



  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoading == false) {
          await validateAdminLogin(); // Verify admin first
          await fetchData();
        }
      } catch (error) {
        console.error(error.message);
        navigate('/admin-login'); // Redirect if validation fails
      }
    };

    initialize(); // Execute the sequence
  }, [navigate, fetchData]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };


  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter the data by search term
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleViewMore = (services) => {
    setModalServices(services);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalServices([]);
  };
  const uniqueServiceIds = [...new Set(filteredData.flatMap(item => {
    let serviceIds = [];
    
    if (!item.service_ids) {
        console.warn(`Skipping item: service_ids is null or empty`, item);
        return []; // Skip this item safely
    }

    try {
        console.log(`Step - 1`, item.service_ids);
        serviceIds = JSON.parse(item.service_ids);
        console.log(`Step - 2`);
    } catch (error) {
        console.error(`JSON parse error:`, error, `for item`, item.service_ids);
        serviceIds = [];
    }

    console.log(`Step - 4`);
    console.log(`serviceIds - `, serviceIds);

    return Array.isArray(serviceIds) ? serviceIds.map(id => Number(id)) : [];
}))];


  // Filter the servicesList to only include the matched services
  const matchedServices = servicesList.filter(service => uniqueServiceIds.includes(service.id));
  const filteredAndSortedData = filteredData.filter((item) => {
    let match = true;

    // Filter by Scope of Service (Dropdown)
    if (scopeFilter && item.service_ids) {
      let serviceIds;
      try {
       
        serviceIds = JSON.parse(item.service_ids);
      console.log('item.service_ids',item.service_ids)
      
      } catch (error) {
        console.error('Failed to parse service_ids', error);
        serviceIds = [];
      }
      const numericServiceIds = serviceIds.map((id) => Number(id));
      match = numericServiceIds.includes(Number(scopeFilter));
    }

    // Filter by Vendor Name
    if (vendorFilter && !item.vendor_name.toLowerCase().includes(vendorFilter.toLowerCase())) {
      match = false;
    }

    // Filter by Month
    if (monthFilter && !item.month_year.toLowerCase().includes(monthFilter.toLowerCase())) {
      match = false;
    }

    return match;
  });

  const displayedEntries = filteredAndSortedData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  const tableRef = useRef(null);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(displayedEntries); // Convert JSON to sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table_data.xlsx");
  };

  console.log('modalServices--', modalServices)
  console.log('services---', servicesList)
  const formatDate = (dob) => {
    let year, month, day;
  
    if (dob.includes('T')) {
      // Handle format like "08T00:00:00.000Z-08-2002"
      const parts = dob.split('-');
      day = parts[0].split('T')[0]; // Extract day before "T"
      month = parts[1];
      year = parts[2];
    } else {
      // Handle format like "2002-08-08"
      [year, month, day] = dob.split('-');
    }
  
    return `${day}-${month}-${year}`;
  };
  
  // Test cases
  console.log(formatDate("2002-08-08")); // Expected: "08-08-2002"
  console.log(formatDate("08T00:00:00.000Z-08-2002")); // Expected: "08-08-2002"
  

  return (
    <div className="w-full bg-[#c1dff2] overflow-hidden">
      <div className="border border-black space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
        {/* Export and Search */}
        <div className="md:flex justify-between items-center">
          <div className="text-left mb-2">
            <div>
              <button className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-6 py-2 rounded"
                onClick={exportToExcel}
              >

                Export to Excel
              </button>
            </div>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-4 mb-0 shadow-sm focus:ring-2 focus:ring-blue-400"
            >
              {optionsPerPage.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="md:flex space-x-4 mb-4">
            <select
              className="border md:w-auto w-full mb-2 p-2 rounded"
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
            >
              <option value="">Select Scope of Service</option>
              {matchedServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title}
                </option>
              ))}
            </select>

            {/* Name of the Vendor Filter */}
            <input
              type="text"
              className="border md:w-auto mb-2 w-full margin-l p-2 rounded"
              placeholder="Search Vendor"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
            />

            {/* Month Filter */}
            <input
              type="text"
              className="border md:w-auto mb-2 w-full no-margin p-2 rounded"
              placeholder="Search Month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-scroll">
          <table className="min-w-full border-collapse border border-black rounded-lg"
            ref={tableRef} >
            <thead className="rounded-lg border border-black">
              <tr className="bg-[#c1dff2] text-[#4d606b] whitespace-nowrap text-left">
                <th className=" uppercase border  border-black px-4 py-2 text-center">SL No</th>
                <th className=" uppercase border  border-black px-4 py-2">Month</th>
                <th className=" uppercase border  border-black px-4 py-2">Date of Initiation</th>
                <th className=" uppercase border  border-black px-4 py-2">Employee ID</th>
                <th className=" uppercase border  border-black px-4 py-2">Reference ID</th>
                <th className=" uppercase border  border-black px-4 py-2">Name of the Applicant</th>
                <th className=" uppercase border  border-black px-4 py-2">Date of Birth</th>
                <th className=" uppercase border  border-black px-4 py-2">Gender</th>
                <th className=" uppercase border  border-black px-4 py-2">Mobile Number</th>
                <th className=" uppercase border  border-black px-4 py-2">Alternate Number</th>
                <th className=" uppercase border  border-black px-4 py-2">Father/Spouse Name</th>
                <th className=" uppercase border  border-black px-4 py-2">Address</th>
                <th className=" uppercase border  border-black px-4 py-2">
                  Scope of Service
                </th>
                <th className=" uppercase border  border-black px-4 py-2">Color Code</th>
                <th className=" uppercase border  border-black px-4 py-2">Name of the Vendor</th>
                <th className=" uppercase border  border-black px-4 py-2">Deadline Date</th>
                <th className=" uppercase border  border-black px-4 py-2">Report Date</th>
                <th className=" uppercase border  border-black px-4 py-2">Case Aging</th>
                <th className=" uppercase border  border-black px-4 py-2">Remarks</th>

              </tr>
            </thead>

            {loading ? (
              <tbody className="h-10">
                <tr>
                  <td colSpan="12" className="w-full py-10 h-10 text-center">
                    <div className="flex justify-center items-center w-full h-full">
                      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : displayedEntries.length === 0 ? (
              <tbody className="h-10">
                <tr>
                  <td colSpan={17} className="py-4 text-center text-red-500">
                    {responseError && responseError !== "" ? responseError : "No data available in table"}

                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {displayedEntries.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black px-4 py-2 text-center">{index + 1 + (currentPage - 1) * entriesPerPage}</td>
                    <td className="border border-black px-4 py-2">{item.month_year}</td>
                    <td className="border border-black px-4 py-2">
                      {(() => {
                        const date = new Date(item.created_at);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}-${month}-${year}`;
                      })()}
                    </td>


                    <td className="border border-black px-4 py-2 whitespace-nowrap">{item.employee_id}</td>
                    <td className="border border-black px-4 py-2">{item.application_id}</td>
                    <td className="border border-black px-4 py-2">{item.name}</td>
                    <td className="border border-black px-4 py-2">{formatDate(item.dob)}</td>
                    <td className="border border-black px-4 py-2">{item.gender}</td>
                    <td className="border border-black px-4 py-2">{item.contact_number}</td>
                    <td className="border border-black px-4 py-2">{item.contact_number2}</td>
                    <td className="border border-black px-4 py-2">{item.father_name || item.spouse_name}</td>
                    <td className="border border-black px-4 py-2 min-w-[500px]">{item.permanent_address}</td>
                    <td className="border  border-black px-4 py-2 text-left">
                      <div className=" ">
                      <div className="flex whitespace-nowrap">
  {(() => {
    let serviceIds = [];

    // Validate & Parse item.service_ids
    if (typeof item.service_ids === "string" && item.service_ids.trim() !== "") {
      try {
        serviceIds = JSON.parse(item.service_ids);
      } catch (error) {
        console.error("Failed to parse service_ids:", error, "Raw value:", item.service_ids);
      }
    }
    // Ensure serviceIds is an array & convert IDs to numbers
    const numericServiceIds = Array.isArray(serviceIds) ? serviceIds.map(Number) : [];

    // Match serviceIds with servicesList
    const matchedServices =
      Array.isArray(servicesList) && servicesList.length > 0
        ? numericServiceIds.map((id) => servicesList.find((service) => service?.id === id)).filter(Boolean)
        : [];

    // UI Logic
    if (matchedServices.length === 0) {
      return (
        <span className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg">
          No matching services found
        </span>
      );
    }

    return matchedServices.length === 1 ? (
      <span className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm">
        {matchedServices[0].title}
      </span>
    ) : (
      <>
        <span className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm">
          {matchedServices[0].title}
        </span>
        <button className="text-blue-500 ml-2" onClick={() => handleViewMore(matchedServices)}>
          View More
        </button>
      </>
    );
  })()}
</div>

                      </div>


                    </td>

                    <td className="border border-black px-4 py-2">{item.color_code}</td>
                    <td className="border border-black px-4 py-2">{item.vendor_name}</td>
                    <td className="border border-black px-4 py-2">{formatDate(item.deadline_date)}</td>
                    <td className="border border-black px-4 py-2">{formatDate(item.report_date)}</td>
                    <td className="border border-black px-4 py-2">{item.case_aging}</td>
                    <td className="border border-black px-4 py-2">{item.remarks}</td>

                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-999">
          <div className="bg-white rounded-lg shadow-lg p-4 w-1/3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Services</h2>
              <button
                className="text-red-500 text-2xl"
                onClick={handleCloseModal}
              >
                &times;
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 w-full m-auto max-h-96 overflow-y-scroll">
              {isModalOpen && (
                <div className="fixed inset-0 bg-black no-margin bg-opacity-50 flex items-center justify-center z-999">
                  <div className="bg-white rounded-lg shadow-lg p-4 md:mx-0 mx-4 md:w-1/3">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold">Services</h2>
                      <button
                        className="text-red-500 text-2xl"
                        onClick={handleCloseModal}
                      >
                        &times;
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 w-full m-auto max-h-96 overflow-y-scroll">
                      {modalServices.length > 0 ? (
                        modalServices.map((service, idx) => {
                          // Find the matching service from serviceList using the id
                          const matchedService = servicesList.find((s) => s.id === service.id);
                          return matchedService ? (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm"
                            >
                              {matchedService.title} {/* Display the service title */}
                            </span>
                          ) : (
                            <span key={idx} className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg text-sm">
                              Service not found
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-gray-500">No service available</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}


    </div>

  );
};

export default CaseAllocationList;
