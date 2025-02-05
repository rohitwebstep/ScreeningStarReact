import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ApplicationStatus = () => {
       const {validateAdminLogin,setApiLoading,apiLoading} = useApiLoading();

    
    const [tableData, setTableData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filters, setFilters] = useState({
        reportGeneratedBy: '',
        qcStatusFetch: '',
        reportDate: '',
        qcDate: '',
        qcStatus: '',
        reportGeneratedByMonth: ''
    });

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage] = useState(10);

    const fetchData = useCallback(() => {
        setLoading(true); // Set loading to true before starting the fetch
        setApiLoading(true);
        
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/report-master/application-tracker?admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                setLoading(false);
                setApiLoading(false);

                const newToken = result.token || result._token || token;
                if (newToken) {
                    console.log('token saved',newToken)
                    localStorage.setItem("_token", newToken);
                }

                // Flatten the response structure to match the table columns
                const flattenedData = result.result.flatMap(customer =>
                    customer.branches.flatMap(branch =>
                        branch.applications.map(application => ({
                            customerId: customer.customer_id,
                            customerName: customer.customer_name,
                            customerUniqueId: customer.customer_unique_id,
                            applicationId: application.application_id,
                            applicationName: application.application_name,
                            clientApplicationId: application.client_application_id,
                            overallStatus: application.overall_status,
                            reportDate: application.report_date,
                            reportGeneratedBy: application.report_generate_by,
                            reportGeneratorName: application.report_generator_name,
                            qcDate: application.qc_date,
                            qcDoneBy: application.qc_done_by,
                            qcDoneByName: application.qc_done_by_name,
                            qcStatus: application.is_verify,
                            services_status: application.services_status
                        })))
                );

                setTableData(flattenedData);
                setFilteredData(flattenedData); // Set filteredData to match the initial table data
            })
            .catch((error) => {
                console.error(error);
                setLoading(false); // In case of an error, make sure loading is set to false
                setApiLoading(false);

            });
    }, []); // empty dependency array ensures it only runs once when component mounts

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

    // Pagination logic: Slice the data to only show the current page
    const paginateData = (data) => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = startIndex + entriesPerPage;
        return data.slice(startIndex, endIndex);
    };

    // Calculate total pages
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };

    // Handle filter change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    // Handle form submission and filtering
    const handleSubmit = (e) => {
        e.preventDefault();

        // Log the filters to track which one is clicked and its value
        console.log("Filters applied:", filters);

        // Filter the table data based on the selected filters
        const result = tableData.filter(item => {
            return (
                (filters.reportGeneratedBy ? item.reportGeneratorName === filters.reportGeneratedBy : true) &&
                (filters.qcStatusFetch ? item.qcDoneByName === filters.qcStatusFetch : true) &&
                (filters.reportDate ? new Date(item.reportDate).toDateString() === new Date(filters.reportDate).toDateString() : true) &&
                (filters.qcDate ? new Date(item.qcDate).toDateString() === new Date(filters.qcDate).toDateString() : true) &&
                (filters.reportGeneratedByMonth ? item.reportDate?.startsWith(filters.reportGeneratedByMonth) : true) &&
                (filters.qcStatus ? item.qcStatus === filters.qcStatus : true) 


            );
        });

        // Update the filtered data state
        setFilteredData(result);
        setCurrentPage(1);  // Reset to the first page after filtering
    };

    const formatDate = (dateString) => {
        if (!dateString || isNaN(new Date(dateString).getTime())) {
            return "N/A";
        }

        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits for day
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };
    const handleDownload = () => {
        const excelData = filteredData.map((item, index) => {
            // Extract dynamic columns from services_status and handle missing values
            const servicesStatus = item.services_status || {};
            const dynamicColumns = Object.keys(servicesStatus)
                .map((service) => `${service}`) // Default to "N/A" if value is missing
                .join(", "); // Join all entries with commas

            return {
                "SL No": (currentPage - 1) * entriesPerPage + index + 1,
                "Reference ID": item.customerUniqueId,
                "Name of the Applicant": item.customerName || "N/A",
                "Scope of the Services": dynamicColumns, // Assign formatted string
                "Component Status": item.overallStatus || "N/A",
                "Report Data": "GENERATE REPORT", // Placeholder for the button column
            };
        });

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

        // Write the workbook and download it
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "ClientsData.xlsx");
    };




    return (
        <div className="w-full bg-[#c1dff2]  overflow-hidden">
           
            <div className="bg-white border border-black p-12 rounded-md w-full mx-auto">

            <button
                onClick={handleDownload}
                className="bg-green-500 text-white rounded px-4 py-2 hover:scale-105 hover:bg-green-600 border"
            >
                Export to Excel
            </button>
                <form onSubmit={handleSubmit} className="flex items-center space-x-4 p-4">

                <div className="w-1/4">
                        <label htmlFor="reportGeneratedBy" className="block text-sm font-medium text-gray-700">Report Generated By</label>
                        <select
                            id="reportGeneratedBy"
                            name="reportGeneratedBy"
                            className="mt-1 block w-full bg-[#f7f6fb] border-gray-300 rounded px-3 py-2"
                            onChange={handleFilterChange}
                        >
                            <option value="">Select an option</option>
                            {tableData.length === 0 ||
                                !tableData.some(row => row.reportGeneratorName) ? (
                                <option disabled>You have no data</option>
                            ) : (
                                tableData
                                    .map((row) => row.reportGeneratorName) // Extract the reportGeneratorName
                                    .filter((name, index, self) => name && self.indexOf(name) === index) // Remove empty and duplicate names
                                    .map((name, index) => (
                                        <option key={index} value={name}>
                                            {name}
                                        </option>
                                    ))
                            )}
                        </select>


                    </div>

                    <div className="w-1/4">
                        <label htmlFor="qcStatusFetch" className="block text-sm font-medium text-gray-700">QC Status Fetch</label>
                        <select
                            id="qcStatusFetch"
                            name="qcStatusFetch"
                            className="mt-1 block w-full bg-[#f7f6fb] border-gray-300 rounded px-3 py-2"
                            onChange={handleFilterChange}
                        >
                            <option value="">Select a status</option>
                            {tableData.length === 0 ||
                                !tableData.some(row => row.qcDoneByName) ? (
                                <option disabled>You have no data</option>
                            ) : (
                                tableData
                                    .map((row) => row.qcDoneByName) // Extract the qcDoneByName
                                    .filter((name, index, self) => name && self.indexOf(name) === index) // Remove empty and duplicate names
                                    .map((name, index) => (
                                        <option key={index} value={name}>
                                            {name}
                                        </option>
                                    ))
                            )}
                        </select>

                    </div>

                    <div className="w-1/4">
                        <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" id="reportDate" name="reportDate" className="mt-1 block w-full bg-[#f7f6fb] border-gray-300 rounded px-3 py-2" onChange={handleFilterChange} />
                    </div>

                    <div className="w-1/4">
                        <label htmlFor="reportGeneratedByMonth" className="block text-sm font-medium text-gray-700">Report Generated By Month</label>
                        <input type="month" id="reportGeneratedByMonth" name="reportGeneratedByMonth" className="mt-1 block w-full bg-[#f7f6fb] border-gray-300 rounded px-3 py-2" onChange={handleFilterChange} />                    </div>
                    <div className="w-auto block text-center">
                        <button type="submit" className="mt-6 px-3 py-3 px-22 bg-[#2c81ba] text-white rounded-md   font-bold hover:scale-105 hover:bg-[#0f5381]">Submit</button>
                    </div>
                </form>

                {/* Filtered Table */}
                <div className="mt-24 overflow-scroll ">
                    <table className="min-w-full border-collapse border border-black overflow-scroll ">
                        <thead>
                            <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b] uppercase">
                                <th className="border border-black px-4 py-2">SL No</th>
                                <th className="border border-black px-4 py-2">Reference ID</th>
                                <th className="border border-black px-4 py-2">Name of the Applicant</th>
                                <th
                                    className="border border-black px-4 py-2 text-center"
                                    colSpan={
                                        filteredData.length > 0
                                            ? Object.keys(filteredData[0]?.services_status || {}).length
                                            : 1
                                    }
                                >
                                    SCOPE OF SERVICES
                                </th>
                                <th className="border border-black px-4 py-2">COMPONENT Status</th>
                                <th className="border border-black px-4 py-2">REPORT DATA</th>



                            </tr>
                        </thead>
                        <tbody className="overflow-scroll">
                            {loading ? (
                                <tr>
                                    <td colSpan="12" className="w-full py-10 h-10 text-center">
                                        <div className="flex justify-center items-center w-full h-full">
                                            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="12" className="w-full py-10 h-10 text-center text-gray-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                paginateData(filteredData).map((row, index) => (
                                    <tr key={row.applicationId}>
                                        <td className="border border-black text-center px-4 py-2">{index + 1}</td>
                                        <td className="border border-black px-4 py-2">{row.customerUniqueId}</td>
                                        <td className="border border-black px-4 py-2">{row.customerName}</td>
                                        {Object.keys(row.services_status).map((service) => (
                                            <td className="border border-black whitespace-nowrap text-center px-4 py-2">{service}</td>
                                        ))}
                                        <td className="border border-black px-4 py-2 uppercase text-center">{row.overallStatus}</td>
                                        <td className="border border-black px-4 py-2 uppercase text-center "><button className="border p-2">GENERATE REPORT</button></td>




                                    </tr>
                                ))
                            )}
                        </tbody>

                    </table>

                    {/* Pagination */}

                </div>
                <div className="flex justify-between mt-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <div>
                        Page {currentPage} of {totalPages}
                    </div>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplicationStatus;
