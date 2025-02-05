import React, { createContext, useState,useEffect, useContext } from "react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { useService } from "./ServiceContext";
Modal.setAppElement("#root");

const ServiceReportForm = () => {
  const [clientData, setClientData] = useState([]); // Changed to an array to handle multiple entries
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // State for current page
  const [itemsPerPage] = useState(10); // Items per page
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const navigate = useNavigate();
  const { setSelectedService } = useService();
  // Function to fetch client data
  const fetchClientData = async () => {
    const adminData = JSON.parse(localStorage.getItem("admin"));
    const admin_id = adminData?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      console.error("Admin ID or Token is missing from localStorage");
      return;
    }

    const url = `https://api.screeningstar.co.in/json-form/generate-report/list?admin_id=${admin_id}&_token=${storedToken}`;

    try {
      const response = await fetch(url);
      const newToken = response.token || response._token || storedToken ;
      if (newToken) {
        console.log("token is saerd" ,newToken)
          localStorage.setItem("_token", newToken);
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      setClientData(result.data); // Set the `data` object in state
    } catch (error) {
      console.error("Error fetching client data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);
  const handleEdit = (service) => {
    setSelectedService(service);
console.log('service',service)
    navigate("/admin-GenerateReportServiceForm"); 
  };
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Filter data based on search query
  const filteredData = clientData.filter((service) =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Function to handle preview button click
  const handlePreview = (id) => {
    const selectedService = clientData.find((service) => service.id === id);
    const parsedData = JSON.parse(selectedService.json); // Parse JSON string
    setPreviewData(parsedData); // Set to preview state
  };

  if (loading) {
    return   <div className="flex w-full justify-center items-center h-20">
    <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
</div>;
  }

  if (!clientData || clientData.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <>
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by service title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md w-full"
        />
      </div>

      <table className={`${previewData ? 'hidden' : ''} min-w-full border-collapse border border-black`}>
        <thead>
          <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b] text-left">
            <th className="uppercase border border-black px-4 py-2 text-center">SI</th>
            <th className="uppercase border border-black px-4 py-2">Service Title</th>
            <th className="uppercase border border-black px-4 py-2">Service Code</th>
            <th className="uppercase border border-black px-4 py-2">Group Name</th>
            <th className="uppercase border border-black px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((service, index) => (
            <tr key={service.id}>
              <td className="border border-black px-4 py-2 text-center">{index + 1}</td>
              <td className="border border-black px-4 py-2">{service.title}</td>
              <td className="border border-black px-4 py-2">{service.service_code}</td>
              <td className="border border-black px-4 py-2">{service.group_name}</td>
              <td className="border border-black px-4 py-2">
              <button
                className="ml-2 p-2 px-4 font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                onClick={() => handleEdit(service)}
              >
                Edit
              </button>
                <button
                  className="ml-2 p-2 px-4 font-bold text-white bg-green-500 hover:bg-green-600 rounded-md"
                  onClick={() => handlePreview(service.id)}
                >
                  Preview
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
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

      {/* Preview Section */}
      {previewData && (
        <div className="py-3 mt-6">
          <button
            className="ml-2  px-10 text-right w-full p-3 font-bold text-red-500 hover:text-red-700 text-5xl border-none rounded-md"
            onClick={() => setPreviewData(null)}
          >
            X
          </button>
          <div className="bg-[#c1dff2] border border-black rounded-t-md p-4">
            <h3 className="text-center text-2xl font-semibold">
              {previewData.heading}
            </h3>
          </div>
          <table className="border-[#c1dff2] border border-t-0 rounded-md w-full">
            <thead>
              <tr className="bg-gray-100">
                {previewData.headers.map((header, index) => (
                  <th key={index} className="py-2 px-4 border border-gray-300 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="py-2 px-4 border border-gray-300">{row.label}</td>
                  {row.inputs.map((input, inputIndex) => (
                    <td key={inputIndex} className="py-2 px-4 border border-gray-300">
                      {input.type === "text" ? (
                        <input
                          type="text"
                          name={input.name}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      ) : input.type === "datepicker" ? (
                        <input
                          type="date"
                          name={input.name}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      ) : input.type === "file" ? (
                        <input
                          type="file"
                          name={input.name}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                          multiple={input.multiple || false}
                          required={input.required || false}
                        />
                      ) : input.type === "dropdown" ? (
                        <select
                          name={input.name}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        >
                          {input.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option.value}>
                              {option.showText}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default ServiceReportForm;
