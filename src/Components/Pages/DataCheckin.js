import React, { useEffect, useState, useCallback, useRef } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
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
    const rowsPerPage = 10;
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
        }
        else {
            setLoading(true);
        }
        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/data-management/applications-by-branch?branch_id=${branchId}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                setLoading(false);
                setData(result.customers || []);

                const newToken = result.token || result._token ||  token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                setParentName(result.parentName);

            })
            .catch((error) => {
                console.error('Fetch error:', error);
            }).finally(() => {
                setLoading(true);
            });

    }, []);




    const fetchServicesData = async (applicationId, servicesList) => {
        if (!servicesList || servicesList.length === 0 || fetchedRowsRef.current.has(applicationId)) return [];
    
        fetchedRowsRef.current.add(applicationId); // Mark as fetched
        setLoading(true); // ✅ Start loading before fetching
    
        try {
            const url = `https://api.screeningstar.co.in/client-master-tracker/services-annexure-data?service_ids=${encodeURIComponent(servicesList)}&application_id=${encodeURIComponent(applicationId)}&admin_id=${encodeURIComponent(adminId)}&_token=${encodeURIComponent(token)}`;
            const response = await fetch(url, { method: "GET" });
            const result = await response.json();
            
            if (result.token || result._token) localStorage.setItem("_token", result.token || result._token || token);
    
            return result.results.filter((item) => item != null);
        } catch (error) {
            console.error("Error fetching service data:", error);
            return [];
        }
    };
    
    const fetchAllServicesData = async () => {
    
        let allServices = [];
        const updatedData = await Promise.all(
            data.map(async (row) => {
                if (!fetchedRowsRef.current.has(row.application_id)) {
                    const servicesList = row.services ? row.services.split(',') : [];
                    const fetchedServices = await fetchServicesData(row.application_id, servicesList);
                    allServices = [...allServices, ...fetchedServices];
    
                    // Add unique headings to Set
                    fetchedServices.forEach(service => {
                        const heading = getServiceHeading(service.reportFormJson);
                        if (heading) uniqueHeadingsSet.current.add(heading);
                    });
    
                    return { ...row, fetchedServices };
                }
                return row;
            })
        );
    
        // Update unique headings once
        setUniqueHeadings([...uniqueHeadingsSet.current]);
        setData(updatedData); // ✅ Updating data to ensure services appear in rows
    
        setLoading(false); // ✅ Stop loading after fetching
    };
    

    useEffect(() => {
        if (data.length > 0) {
            fetchAllServicesData();
        }
    }, [data]);

    const getServiceHeading = (reportFormJson) => {
        try {
            const parsedJson = JSON.parse(reportFormJson.json);
            return parsedJson.heading || 'No Heading Available';
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return 'No Heading Available';
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
        const exportData = filteredData.map((data, index) => ({
            "SL NO": index + 1,
            "TAT Days": adminTAT[index] || 'NIL',
            "Location": data.location || 'NIL',
            "Name": data.name || 'NIL',
            "Reference Id": data.application_id || 'NIL',
            "Photo": data.photo || 'NIL',
            "Applicant Employee Id": data.employee_id || 'NIL',
            "Initiation Date": new Date(data.created_at).toLocaleDateString(),
            "Deadline Date": new Date(data.updated_at).toLocaleDateString(),
            "Report Data": "Generate Report", // Adjust if you want this to reflect actual data
            "Download Status": data.overall_status === 'completed' ?
                (data.is_verify === 'yes' ? 'DOWNLOAD' : 'QC PENDING') :
                (data.overall_status === 'wip' ? 'WIP' : 'NOT READY')
        }));

        // Add any additional dynamic columns from expandedRow
        expandedRow?.headingsAndStatuses?.forEach((item, idx) => {
            exportData.forEach(data => {
                const key = item.status;  // Use status or heading to name the new column
                data[key] = item.status;  // Add this dynamically to each row
            });
        });

        // Convert to worksheet and create workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, "report_data.xlsx");
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
            <div className="space-y-4 py-[30px] px-[51px] bg-white">
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
                <div className='flex justify-between items-baseline mb-6 '>

                    <div className=" text-left">
                        <button
                            className="bg-green-500 hover:bg-green-600 transition-all duration-300 ease-in-out transform hover:scale-105  text-white px-6 py-2 rounded"
                            onClick={handleExportToExcel}
                        >
                            Export to Excel
                        </button>
                    </div>
                    <div className=" w-1/2 text-right">
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
                    <table className="min-w-full border-collapse border border-black overflow-scroll rounded-lg whitespace-nowrap">
                        <thead className='rounded-lg'>
                            <tr className="bg-[#c1dff2] text-[#4d606b]">
                                <th className="uppercase border border-black px-4 py-2">SL NO</th>
                                <th className="uppercase border border-black px-4 py-2">Date of Initiation</th>
                                <th className="uppercase border border-black px-4 py-2">Applicant Employee Id</th>
                                <th className="uppercase border border-black px-4 py-2">Reference Id</th>
                                <th className="uppercase border border-black px-4 py-2">Photo</th>
                                <th className="uppercase border border-black px-4 py-2">Name Of Applicant</th>
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
                                        You have no data
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {filteredData.map((data, index) => (
                                        <React.Fragment key={data.id}>
                                            <tr className="text-center">
                                                <td className="border border-black px-4 py-2">{index + 1}</td>
                                                <td className="border border-black px-4 py-2">
                                                    {new Date(data.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="border border-black px-4 py-2">{data.employee_id || 'NIL'}</td>
                                                <td className="border border-black px-4 py-2">{data.application_id || 'NIL'}</td>
                                                <td className="border border-black px-4 py-2 text-center">
                                                    <div className='flex justify-center items-center'>
                                                        <img src={`${data.photo}`} alt={data.name} className="w-10 h-10 rounded-full" />
                                                    </div>
                                                </td>
                                                <td className="border border-black px-4 py-2">{data.name || 'NIL'}</td>

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
