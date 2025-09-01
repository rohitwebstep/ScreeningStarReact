import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
const RecordTrackers = () => {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const [allApplications, setAllApplications] = useState([]);
  const [companyInfo, setCompanyInfo] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [costInfo, setCostInfo] = useState([]);
  const [serviceInfo, setServiceInfo] = useState([]);
  const [serviceNames, setServiceNames] = useState([]);
  const [noValuesMatched, setNoValuesMatched] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);  // Track selected row for check-in
  const [expandedRow, setExpandedRow] = useState(null);
  const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
  const token = localStorage.getItem('_token');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "month") setMonth(value);
    if (name === "year") setYear(value);
  };

  const handleSearch = async () => {
    if (!month || !year) {
      alert("Please select both month and year.");
      return;
    }

    setLoading(true);
    setNoValuesMatched(false);

    try {
      const requestOptions = {
        method: "GET",
        redirect: "follow",
      };

      const response = await fetch(
        `https://api.screeningstar.co.in/record-tracker?admin_id=${adminId}&_token=${token}&month=${month}&year=${year}`,
        requestOptions
      );

      if (!response.ok) {
        // Show dynamic SweetAlert if the response is not OK
        const errorMessage = `Error ${response.status}: ${response.statusText}`;
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: errorMessage,
        });
        return;
      }

      const result = await response.json();

      if (result?.customers?.length > 0) {
        setTableData(result.customers);
      } else {
        setNoValuesMatched(true);
        setTableData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching the data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (customerId) => {
    // Check if the selected row is already the one being processed
    if (selectedRow === customerId) {
      return; // Skip the API call if it's already selected
    }

    // Set the selected row to highlight or manage it
    setSelectedRow(customerId);

    // Set loading state to true
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/record-tracker/report?customer_id=${customerId}&admin_id=${adminId}&_token=${token}&month=${month}&year=${year}`,
        { method: "GET" }
      );

      const result = await response.json(); // Assuming the result is in JSON format

      if (response.ok) {
        setAllApplications(result?.applications || []);
        setCompanyInfo(result?.companyInfo || []);
        setCustomer(result?.customer || []);
        setCostInfo(result?.finalArr?.costInfo || []);

        const serviceNames = result?.serviceNames || [];
        setServiceNames(serviceNames);

        const serviceInfo = result?.finalArr?.serviceInfo || [];
        const updatedServiceInfo = serviceInfo.map((service) => {
          // Find the matching service name by ID
          const matchingService = serviceNames.find((name) => name.id === service.serviceId);

          // Return a new service object with the shortCode added
          return {
            ...service,
            shortCode: matchingService?.shortCode || null, // Add shortCode or default to null
          };
        });
        setServiceInfo(updatedServiceInfo);
      } else {
        console.error("Failed to fetch check-in data:", result);
      }
    } catch (error) {
      console.error("Error fetching check-in data:", error);
    } finally {
      // Set loading state to false after request is complete
      setIsLoading(false);
    }
  };


  const handleDownloadExcel = () => {
    if (tableData.length === 0) {
      alert("No data available to download.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    XLSX.writeFile(workbook, `RecordTrackers_${month}_${year}.xlsx`);
  };
  const toggleRow = (rowIndex) => {
    setExpandedRow(expandedRow === rowIndex ? null : rowIndex);
  };

  let servicePricingArr = [];
  return (
    <div className="w-full bg-[#c1dff2] border border-black overflow-hidden">
      <div className="space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
        <div className="border border-gray-400 shadow-lg p-10 md:w-8/12 w-full mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#4d606b] px-3 pb-8">
            RECORDS & TRACKERS
          </h2>
          <div className="md:flex space-x-4 items-center justify-center mb-4">
            <div className="md:flex items-center space-x-4 mb-4">
              <label>SELECT MONTH</label>
              <select className="border p-2 md:w-auto w-full margin-l" name="month" value={month} onChange={handleInputChange}>
                <option value="">SELECT MONTH</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:flex items-center space-x-4 margin-l mb-4">
              <label>SELECT YEAR</label>
              <select className="border p-2 md:w-auto w-full margin-l" name="year" value={year} onChange={handleInputChange}>
                <option value="">SELECT YEAR</option>
                {[2025,2024, 2023, 2022].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center items-center mt-3 w-full">
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-[#2c81ba] text-white   hover:scale-105 font-bold rounded-md hover:bg-[#0f5381] transition duration-200"
            >
              SUBMIT
            </button>
          </div>
        </div>

        <button
          onClick={handleDownloadExcel}
          className="bg-green-500 hover:bg-green-600 hover:scale-105 rounded transition duration-200  text-white p-2"
        >
          Download Excel
        </button>

        <div className="overflow-scroll">
          <table className="min-w-full border-collapse border border-black overflow-scroll" id="table_invoice">
            <thead>
              <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b]">
                <th className="border border-black px-4 uppercase py-2">Sl</th>
                <th className="border border-black px-4 uppercase py-2">Client Code</th>
                <th className="border border-black px-4 text-left uppercase py-2">Client Company Name</th>
                <th className="border border-black px-4 uppercase py-2">CHECK IN</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="border border-black px-4 py-2 text-center">
                    <div className="flex w-full justify-center items-center h-20">
                      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : tableData.length > 0 ? (
                tableData.map((item, index) => (
                  <React.Fragment key={index}>
                    {/* Main Row */}
                    <tr
                      className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                      onClick={() => toggleRow(index)} // Toggle the row expansion
                    >
                      <td className="border border-black text-center px-4 py-2">{index + 1}</td>
                      <td className="border border-black text-center px-4 py-2">{item.client_unique_id}</td>
                      <td className="border border-black text-left px-4 py-2">{item.name}</td>
                      <td className="border border-black text-center px-4 py-2">
                        <button
                          className={`p-6 py-3 bg-[#2c81ba]   hover:scale-105 font-bold  transition duration-200 text-white rounded-md  
  ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#0f5381]"}`}
                          onClick={() => {
                            if (!isLoading) {
                              if (expandedRow !== null) {
                                // If a row is expanded, clicking again will toggle it off without triggering API call
                                setExpandedRow(null);
                                setSelectedRow(null);
                              } else {
                                setIsLoading(true); // Set loading state to true
                                handleCheckIn(item.main_id).finally(() => setIsLoading(false)); // Reset loading state after handling
                              }
                            }
                          }}
                          disabled={isLoading} // Disable button when loading
                        >
                          CHECK IN
                        </button>


                      </td>
                    </tr>

                    {/* Expanded Row (New Table) */}
                    {expandedRow === index && serviceInfo.length > 0 && (
                      <tr>
                        <td colSpan="3" className="border border-black px-4 py-2">
                          {/* Nested Table */}
                          <table className="min-w-full border-collapse border border-black">
                            <thead>
                              <tr className="bg-[#f0f0f0] text-[#4d606b]">
                                <th className="border border-black px-4 py-2">SR No.</th>
                                <th className="border border-black px-4 py-2">Application ID</th>
                                <th className="border border-black px-4 py-2">Case Received</th>
                                <th className="border border-black px-4 py-2">Candidate Full Name</th>
                                {serviceInfo.map((service) => {
                                  return (
                                    <th className="border border-black px-4 py-2" key={service.serviceId}>
                                      {service.shortCode}
                                    </th>
                                  );
                                })}
                                <th className="border border-black px-4 py-2">Pricing</th>
                                <th className="border border-black px-4 py-2">Report Date</th>
                              </tr>
                            </thead>
                            <tbody>

                              {allApplications.map((branchData, branchIndex) => {
                                const { applications } = branchData;

                                return applications.map((application, appIndex) => {
                                  // Split services into an array
                                  const appServiceArr = application.services.split(',');
                                  let applicationPricing = 0;

                                  return (
                                    <tr key={application.id}>
                                      <td className="border border-black px-4 py-2">{appIndex + 1}</td>
                                      <td className="border border-black px-4 py-2">{application.application_id}</td>
                                      <td className="border border-black px-4 py-2">
                                        {new Date(application.created_at).toLocaleDateString()}
                                      </td>
                                      <td className="border border-black px-4 py-2">{application.name}</td>

                                      {/* Render service titles based on the service info */}
                                      {serviceInfo.map((service) => {
                                        // Check if serviceId matches with any in appServiceArr
                                        const matchingService = appServiceArr.find(serviceId => serviceId === String(service.serviceId)); // Convert to string for comparison

                                        // If a matching service is found, accumulate pricing
                                        if (matchingService && service.price) {
                                          applicationPricing += service.price;
                                        }
                                        const rawServicePriceForArr = { "serviceId": service.serviceId, "price": service.price };
                                        const servicePricingArrIndex = servicePricingArr.findIndex(item => item.serviceId === service.serviceId);

                                        // If the serviceId exists, update the price; otherwise, push the new service price object.
                                        if (servicePricingArrIndex !== -1) {
                                          servicePricingArr[servicePricingArrIndex].price = service.price;
                                        } else {
                                          servicePricingArr.push(rawServicePriceForArr);
                                        }

                                        return (
                                          <td className="border border-black px-4 py-2" key={service.serviceId}>
                                            {matchingService ? service.price : 'NIL'}
                                          </td>
                                        );
                                      })}

                                      {/* Display the total pricing of the application */}
                                      <td className="border border-black px-4 py-2">{applicationPricing || 0}</td>

                                      <td className="border border-black px-4 py-2">
                                        {new Date(application.report_date).toLocaleDateString()}
                                      </td>
                                    </tr>
                                  );
                                });
                              })}
                              <tr>
                                <td className="border border-black px-4 py-2" colSpan={4}>TOTAL</td>
                                {serviceInfo.map((service) => {
                                  // Check if serviceId matches with any in servicePricingArr
                                  const matchingService = servicePricingArr.find(servicePrice => servicePrice.serviceId === service.serviceId); // no need for String conversion
                                  console.log(`serviceInfo - `, serviceInfo);
                                  console.log(`servicePricingArr - `, servicePricingArr);
                                  return (
                                    <td className="border border-black px-4 py-2" key={service.serviceId}>
                                      {matchingService ? matchingService.price : '0'}
                                    </td>
                                  );
                                })}
                                <td className="border border-black px-4 py-2">{servicePricingArr.reduce((sum, service) => sum + service.price, 0)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="border border-black px-4 py-2 text-center text-red-600">
                    {noValuesMatched
                      ? "No results matched your search criteria."
                      : "No data available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Display check-in data if available */}


      </div>
    </div>
  );
};

export default RecordTrackers;
