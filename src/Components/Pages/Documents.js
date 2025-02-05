import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';  // Import XLSX for Excel export
import { useApiLoading } from '../ApiLoadingContext';
import Swal from 'sweetalert2';

const Documents = () => {
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState(null);
     const {validateAdminLogin,setApiLoading,apiLoading} = useApiLoading();


    const [clientData, setClientData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(null);
    const [isBlockLoading, setIsBlockLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeCases, setActiveCases] = useState(null);
    const [nonHeadBranchData, setNonHeadBranchData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const totalPages = Math.ceil(clientData.length / rowsPerPage);
    const paginatedData = clientData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handlePageChange = (page) => {
        ;
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }


    const fetchData = useCallback(() => {
        setLoading(true);
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

        fetch(`https://api.screeningstar.co.in/client-master-tracker/list?admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                const newToken = result.token || result._token  || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                setClientData(result.data.customers);
                setApiLoading(false);

                setLoading(false);
            })
            .catch((error) => console.error(error)).finally(() => {
               
        setApiLoading(false);
        setLoading(false);
            });
    }, []);





    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                await validateAdminLogin(); // Verify admin first
                await fetchData();
                } // Fetch data after verification
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login'); // Redirect if validation fails
            }
        };

        initialize(); // Execute the sequence
    }, [navigate, fetchData]);

    const handleCheckIn = (main_id) => {
        if (activeCases && activeCases.main_id === main_id) {
            setActiveCases(null); // Toggle off if the same client is clicked again
            setNonHeadBranchData([]);
            return;
        }
        setIsLoading(main_id);

        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/client-master-tracker/branch-list-by-customer?customer_id=${main_id}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((result) => {
                const newToken = result.token || result._token  || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                setActiveCases({ main_id }); // Set the active client
                setNonHeadBranchData(result.customers);
            })
            .catch((error) => {
                console.error(error); // Log error for debugging
                setError(`Error fetching branches: ${error.message}`);
            })
            .finally(() => {
                setIsLoading(null); // Set loading state to false
            });
    };


    const handleDelete = (main_id) => {
        // Handle delete functionality here
    };
    const handleCheckInGo = (branch_id, main_id) => {
        navigate(`/admin-DocumentCheckin?clientId=${main_id}&branchId=${branch_id}`);
    };
    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredData = paginatedData.filter((data) =>
        data.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBlock = async (id) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        // Check if admin_id or storedToken is missing
        if (!admin_id || !storedToken) {
            console.error("Missing admin_id or _token");
            return;
        }

        // Show confirmation alert
        const confirmation = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, block it!",
        });

        if (confirmation.isConfirmed) {
            setIsBlockLoading(true);
            setActiveId(id);
            try {
                const response = await fetch(
                    `https://api.screeningstar.co.in/customer/inactive?customer_id=${id}&admin_id=${admin_id}&_token=${storedToken}`,
                    {
                        method: "GET",
                        redirect: "follow",
                    }
                );
                const result = await response.json();

                const newToken = result.token || result._token  || storedToken;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                Swal.fire("Blocked!", "The customer has been blocked successfully.", "success");

                fetchData(); // Refresh active accounts
            } catch (error) {
                console.error("Failed to block customer:", error);
            } finally {
                setIsBlockLoading(false);
                setActiveId(null); // Reset loading state
            }
        }
    };

    return (
        <div className="">
            <div className="bg-white border border-black p-12 w-full mx-auto">

                <div className='flex justify-between items-baseline mb-3' >

                    <div className="w-1/2 text-right">
                        <input
                            type="text"
                            placeholder="Search by Name"
                            className="w-full rounded-md p-2.5 border border-gray-300"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                </div>
                <table className="min-w-full border-collapse border border-black rounded-lg">
                    <thead>
                        <tr className="bg-[#c1dff2] text-left text-[#4d606b]">
                            <th className="uppercase border border-black px-4 py-2 text-center">SL</th>
                            <th className="uppercase border border-black px-4 py-2">Client ID</th>
                            <th className="uppercase border border-black px-4 py-2">Organization Name</th>
                            {/* <th className="uppercase border border-black px-4 py-2">Client Spoc</th> */}
                            {/* <th className="uppercase border border-black px-4 py-2 text-center">Active Cases</th> */}
                            <th className="uppercase border border-black px-4 py-2 text-center">Action</th>
                        </tr>
                    </thead>
                    {loading ? (
                        <tbody className="h-10">
                            <tr className="">
                                <td colSpan="10" className="w-full py-10 h-10  text-center">
                                    <div className="flex justify-center  items-center w-full h-full">
                                        <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    ) : (
                        <tbody>
                            {filteredData.length > 0 ? (
                                paginatedData.map((item, index) => (
                                    <React.Fragment key={item.client_unique_id}>
                                        <tr className="text-left">
                                            <td className="border border-black px-4 py-2 text-center">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                            <td className="border border-black px-4 py-2">{item.client_unique_id}</td>
                                            <td className="border border-black px-4 py-2">{item.name || 'N/A'}</td>
                                            {/* <td className="border border-black px-4 py-2">
                                                {item.client_spoc_name && item.client_spoc_name.length > 0
                                                    ? item.client_spoc_name.join(", ")
                                                    : 'N/A'}
                                            </td> */}
                                            {/* <td className="border border-black px-4 py-2 text-center">{item.application_count}</td> */}

                                            {item.head_branch_applications_count >= 0 && (
                                                <td className="border border-black px-4 py-2 text-center">
                                                    {item.application_count <= item.head_branch_applications_count ? (
                                                        // Condition 1: Show only Check In button
                                                        <button
                                                            className="px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 hover:scale-105 transition-transform duration-300 ease-in-out transform"
                                                            onClick={() => handleCheckInGo(item.head_branch_id, item.main_id)}
                                                        >
                                                            Check In
                                                        </button>
                                                    ) : item.application_count > item.head_branch_applications_count && item.head_branch_applications_count > 0 ? (
                                                        // Condition 2: Show both Check In and View Branches buttons
                                                        <>
                                                            <button
                                                                className="px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 hover:scale-105 transition-transform duration-300 ease-in-out transform"
                                                                onClick={() => handleCheckInGo(item.head_branch_id, item.main_id)}
                                                            >
                                                                Check In
                                                            </button>
                                                            <button
                                                                onClick={() => handleCheckIn(item.main_id)}
                                                                className={`ml-2 px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 transition-transform duration-300 ease-in-out transform ${isLoading === item.main_id
                                                                    ? 'opacity-50 cursor-not-allowed'
                                                                    : activeCases && activeCases.main_id === item.main_id
                                                                        ? 'bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-300'
                                                                        : 'bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-300'
                                                                    } ${!isLoading && 'hover:scale-105'}`}
                                                                disabled={isLoading === item.main_id}
                                                            >
                                                                {activeCases && activeCases.main_id === item.main_id ? 'Less' : 'View Branches'}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        // Condition 3: Show only View Branches button
                                                        item.head_branch_applications_count === 0 && item.application_count > 0 && (
                                                            <button
                                                                onClick={() => handleCheckIn(item.main_id)}
                                                                className={`px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 transition-transform duration-300 ease-in-out transform ${isLoading === item.main_id
                                                                    ? 'opacity-50 cursor-not-allowed'
                                                                    : activeCases && activeCases.main_id === item.main_id
                                                                        ? 'bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-300'
                                                                        : 'bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-300'
                                                                    } ${!isLoading && 'hover:scale-105'}`}
                                                                disabled={isLoading === item.main_id}
                                                            >
                                                                {activeCases && activeCases.main_id === item.main_id ? 'Less' : 'View Branches'}
                                                            </button>
                                                        )
                                                    )}
                                                </td>
                                            )}
                                            {/* <td className="border border-black text-center px-4  py-2">
                                                <button
                                                    onClick={() => handleBlock(item.main_id)}
                                                    disabled={isBlockLoading && activeId === item.main_id}
                                                    className={`px-4 py-2 text-white bg-red-500  hover:bg-red-600 font-semibold rounded-md transition-transform duration-300 ease-in-out ${isBlockLoading && activeId === item.main_id
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : 'bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-300 hover:scale-105'
                                                        }`}
                                                >
                                                    {isBlockLoading && activeId === item.main_id ? 'Blocking...' : 'Block'}
                                                </button>
                                            </td> */}
                                        </tr>
                                        {activeCases && activeCases.main_id === item.main_id && nonHeadBranchData.length > 0 && (
                                            <tr className="text-center py-4">
                                                <td colSpan="8" className="border border-black px-4 py-8">
                                                    <table className="w-full mt-2">
                                                        <thead>
                                                            <tr className="bg-gray-300">
                                                                <th className=" uppercase border border-black px-4 py-2">SL</th>
                                                                <th className=" uppercase border border-black px-4 py-2">Branch Name</th>
                                                                <th className=" uppercase border border-black px-4 py-2">Application Count</th>
                                                                <th className=" uppercase border border-black px-4 py-2">Check in</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {nonHeadBranchData.map((branch, index) => (
                                                                <tr key={branch.branch_id}>
                                                                   
                                                                    <td className="border border-black px-4 py-2">{index + 1}</td>
                                                                    <td className="border border-black px-4 py-2">{branch.branch_name}</td>
                                                                    <td className="border border-black px-4 py-2">{branch.application_count}</td>
                                                                    <td className="border border-black px-4 py-2">
                                                                        <button
                                                                            className="px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 hover:scale-105  transition-transform duration-300 ease-in-out transform "
                                                                            onClick={() => handleCheckInGo(branch.branch_id, item.main_id)}
                                                                        >
                                                                            Check In
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-4">You have no data</td>
                                </tr>
                            )}
                        </tbody>
                    )}
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
    );
};

export default Documents;
