import React, { useEffect, useState, useCallback, useRef } from 'react';
import Swal from 'sweetalert2'
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Default from "../../imgs/default.png"
import * as XLSX from 'xlsx';  // Import XLSX for Excel export
import { FaChevronLeft } from 'react-icons/fa';

const DataCheckin = () => {
    const [uniqueHeadings, setUniqueHeadings] = useState([]);
    const fetchedRowsRef = useRef(new Set()); // Track fetched rows
    const uniqueHeadingsSet = useRef(new Set());

    const [servicesDataInfo, setServicesDataInfo] = useState('');
    const [expandedRow, setExpandedRow] = useState({ index: '', headingsAndStatuses: [] });
    const navigate = useNavigate();
    const [organisationName, setOrganisationName] = useState([]);

    const [loadingGenrate, setLoadingGenrate] = useState(null);
    const location = useLocation();
    const [adminTAT, setAdminTAT] = useState('');
    const [data, setData] = useState([]);

    const [serviceMatchId, setServiceMatchId] = useState([]);

    const [reportData, setReportData] = useState({});
    const [loading, setLoading] = useState(false);

    const [serviceresults, setServiceresults] = useState([]);

    const [servicesLoading, setServicesLoading] = useState(false);

    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [parentName, setParentName] = useState("N/A");


    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200];
    const totalPages = Math.ceil(data.length / rowsPerPage);
    const paginatedData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const colorNames = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink'];
    const getColorStyle = (status) => {
        // Check if the status contains any color name
        for (let color of colorNames) {
            if (status.toLowerCase().includes(color)) {
                return { color: color, fontWeight: 'bold' };  // Return the style with the matching color
            }
        }
        return {}; // Default if no color is found
    };
    const handlePageChange = (page) => {
        ;
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }

    const queryParams = new URLSearchParams(location.search);
    const clientId = queryParams.get('clientId');
    const branchId = queryParams.get('branchId');
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem('_token');

    // Fetch data from the main API
    const fetchData = useCallback(() => {
        if (!branchId || !adminId || !token) {
            return;
        } else {
            setLoading(true);
        }

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/data-management/applications-by-branch?branch_id=${branchId}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                setLoading(false); // Ensure loading is stopped

                if (Array.isArray(result.customers) && result.customers.length === 0) {
                    // Swal.fire({
                    //     icon: "warning",
                    //     title: "No Data",
                    //     text: "No data available in table available.",
                    // });
                    navigate('/admin-data-management');

                    return;
                }

                setData(result.customers || []);
                setParentName(result.parentName);

                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
            })
            .catch((error) => {
                console.error('Fetch error:', error);
                Swal.fire({
                    icon: "error",
                    title: "Fetch Error",
                    text: "Failed to fetch data. Please try again later.",
                });
            })
            .finally(() => {
                setLoading(false); // Ensure loading stops in all cases
            });

    }, [branchId, adminId, token]);




    const hasFetchedDataRef = useRef(false); // Prevent multiple fetch calls

    const fetchServicesData = async (applicationId, servicesList) => {
        if (!servicesList || servicesList.length === 0 || fetchedRowsRef.current.has(applicationId)) return [];

        fetchedRowsRef.current.add(applicationId); // Mark as fetched

        try {
            const url = `https://api.screeningstar.co.in/client-master-tracker/services-annexure-data?service_ids=${encodeURIComponent(servicesList.join(','))}&application_id=${encodeURIComponent(applicationId)}&admin_id=${encodeURIComponent(adminId)}&_token=${encodeURIComponent(token)}`;
            const response = await fetch(url, { method: "GET" });
            const result = await response.json();

            if (result.token || result._token) {
                localStorage.setItem("_token", result.token || result._token || token);
            }

            return result.results.filter(item => item != null);
        } catch (error) {
            console.error("Error fetching service data:", error);
            return [];
        }
    };

    const fetchAllServicesData = async () => {
        const applicationServiceMap = new Map();

        data.forEach(row => {
            const servicesList = row.services ? row.services.split(',') : [];
            if (!fetchedRowsRef.current.has(row.application_id)) {
                if (!applicationServiceMap.has(row.application_id)) {
                    applicationServiceMap.set(row.application_id, []);
                }
                applicationServiceMap.get(row.application_id).push(...servicesList);
            }
        });

        const results = [];

        // Fetch one by one using for...of
        for (const [applicationId, servicesList] of applicationServiceMap.entries()) {
            const uniqueServices = [...new Set(servicesList)];
            const fetchedServices = await fetchServicesData(applicationId, uniqueServices);

            fetchedServices.forEach(service => {
                const heading = getServiceHeading(service.reportFormJson);
                if (heading) uniqueHeadingsSet.current.add(heading);
            });

            results.push({ applicationId, fetchedServices });
        }

        const updatedData = data.map(row => {
            const matchingResult = results.find(result => result.applicationId === row.application_id);
            return matchingResult ? { ...row, fetchedServices: matchingResult.fetchedServices } : row;
        });

        setUniqueHeadings([...uniqueHeadingsSet.current]);
        console.log(`updatedData - `, updatedData);
        setData(updatedData);
        setLoading(false);
    };
    
    useEffect(() => {
        if (data.length > 0 && !hasFetchedDataRef.current) {
            hasFetchedDataRef.current = true; // Run only once
            fetchAllServicesData();
        }
    }, [data]);
    

    const getServiceHeading = (reportFormJson) => {
        try {
            const parsedJson = JSON.parse(reportFormJson.json);
            return parsedJson.heading?.trim() || undefined;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return undefined;
        }
    };


    const handleUpload = (applicationId, branchid) => {
        navigate(`/admin-DataGenerateReport?applicationId=${applicationId}&branchid=${branchid}&clientId=${clientId}`);
    };

    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );


    const handleExportToExcel = () => {
        const table = document.getElementById("exceltable"); // Select your table
        const ws = XLSX.utils.table_to_sheet(table, { raw: true }); // Convert table to sheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report Data");
    
        XLSX.writeFile(wb, "Report_Data.xlsx");
    };
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };
    const filteredData = paginatedData.filter((data) =>
        data.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const handleGoBack = () => {
        navigate('/admin-data-management');
    };
    useEffect(() => {
        const initialize = async () => {
            try {
                await fetchData();
            } catch (error) {
                console.error('An error occurred:', error.message);
            }
        };

        initialize();
    }, []);
    const getServiceStatus = (annexureData) => {
        return annexureData && annexureData.status !== null ? annexureData.status : ' INITIATED';
    };
    return (
        <div className="bg-[#c1dff2]">
            <h2 className="text-2xl font-bold py-3 text-left text-[#4d606b] px-3 border">DATA CHECKIN - {parentName}</h2>
            <div className="space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                {/* <div className='text-center flex justify-center items-center mb-6 '>
                    <button
                        className={`bg-[#2c81ba] text-white  transition-all duration-300 ease-in-out transform hover:scale-105 rounded px-4 ${servicesLoading ? 'opacity-50 cursor-not-allowed' : ''} py-2 hover:bg-[#073d88]`}
                        onClick={() => handleViewMore()}
                    >
                        {expandedRow && expandedRow.headingsAndStatuses.length > 0 ? 'Hide' : 'Show Servces'}
                    </button>

                </div> */}
                <div className='md:flex justify-between items-baseline mb-6 '>

                    <div className=" text-left mb-2">
                        <div>
                            <button
                                className="bg-green-500 hover:bg-green-600 transition-all duration-300 ease-in-out transform hover:scale-105  text-white px-6 py-2 rounded"
                                onClick={handleExportToExcel}
                            >
                                Export to Excel
                            </button>
                        </div>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-4  shadow-sm focus:ring-2 focus:ring-blue-400"
                        >
                            {optionsPerPage.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className=" md:w-1/2 w-full text-right">
                        <input
                            type="text"
                            placeholder="Search by Name"
                            className="w-full rounded-md p-2.5 border border-gray-300"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="rounded-lg overflow-scroll">
                    <table id='exceltable' className="min-w-full border-collapse border border-black overflow-scroll rounded-lg whitespace-nowrap">
                        <thead className='rounded-lg'>
                            <tr className="bg-[#c1dff2] text-[#4d606b]">
                                <th className="uppercase border border-black px-4 py-2">SL NO</th>
                                <th className="uppercase border border-black px-4 py-2">Date of Initiation</th>
                                <th className="uppercase border border-black px-4 py-2">Applicant Employee Id</th>
                                <th className="uppercase border border-black px-4 py-2">Reference Id</th>
                                <th className="uppercase border border-black px-4 py-2">Photo</th>
                                <th className="uppercase border border-black px-4 py-2">Name Of Applicant</th>
                                <th className="uppercase border border-black px-4 py-2">Data QC</th>
                                <th className="uppercase border border-black px-4 py-2">Report Data</th>


                                {uniqueHeadings.map((heading, idx) => (
                                    <th key={idx} className="border border-black px-4 py-2">{heading}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={17} className="py-4 text-center text-gray-500">
                                        <Loader className="text-center" />
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={17} className="py-4 text-center text-gray-500">
                                        No data available in table
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {filteredData.map((data, index) => (
                                        <React.Fragment key={data.id}>
                                            <tr className="text-center">
                                                <td className="border border-black px-4 py-2">{index + 1}</td>
                                                <td className="border border-black px-4 py-2">
                                                    {new Date(data.created_at).toLocaleDateString("en-GB").replace(/\//g, "-")}
                                                </td>

                                                <td className="border border-black px-4 py-2">{data.employee_id || 'NIL'}</td>
                                                <td className="border border-black px-4 py-2">{data.application_id || 'NIL'}</td>
                                                <td className="border border-black px-4 py-2 text-center">
                                                    <div className='flex justify-center items-center'>
                                                        <img
                                                            src={data.photo ? data.photo : `${Default}`}
                                                            alt={data.name || 'No name available'}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="border border-black px-4 py-2">{data.name || 'NIL'}</td>
                                                <td className="border border-black px-4 py-2">
  {data.is_data_qc === 1 ? 'YES' : data.is_data_qc === 0 ? 'NO' : 'NO'}
</td>

                                                {/* Report Data Button */}
                                                <td className="border border-black px-4 py-2">
                                                    <button
                                                        className="bg-white border border-[#073d88] text-[#073d88] px-4 py-2 rounded hover:bg-[#073d88] hover:text-white"
                                                        onClick={() => handleUpload(data.id, data.branch_id)}
                                                    >
                                                        BASIC ENTRY
                                                    </button>
                                                </td>

                                                {/* Service Statuses */}
                                                {uniqueHeadings.map((heading, idx) => {
                                                    const service = data.fetchedServices?.find(service => getServiceHeading(service.reportFormJson) === heading);
                                                    return (
                                                        <td key={idx} className="border border-black px-4 py-2">
                                                            {service ? getServiceStatus(service.annexureData) : ''}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>

                </div>
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
        </div >
    );

};

export default DataCheckin;
