import React, { useEffect, useRef, useState, useCallback } from "react";
import Swal from 'sweetalert2';
import swal from 'sweetalert';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';

const Vendors = () => {
    const clientEditRef = useRef(null);
    const [deletingId, setDeletingId] = useState(null);
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const navigate = useNavigate();
    const [spocs, setSpocs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [responseError, setResponseError] = useState(null);
    const [services, setServices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalServices, setModalServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);

    const handleViewMore = (services) => {
        setModalServices(services);
        setIsModalOpen(true);
    };

    const handleCloseServiceModal = () => {
        setIsModalOpen(false);
        setModalServices([]);
    };
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        vendor_name: "",
        registered_address: "",
        authorized_person_name: "",
        authorized_person_designation: "",
        mobile_number: "",
        email_id: "",
        spoc_name: "",
        spoc_designation: "",
        service_presence: "",
        scope_of_services: "",
        pricing: "",
        turnaround_time: "",
        standard_process: "",
        vendor_status: "",
        remarks: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [currentSpocId, setCurrentSpocId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setApiLoading(true);

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            console.error('Missing admin_id or _token');
            setLoading(false);
            setApiLoading(false);
            return;
        }

        const url = `https://api.screeningstar.co.in/internal-storage/vendor/list?admin_id=${admin_id}&_token=${storedToken}`;

        try {
            const response = await fetch(url, { method: "GET", redirect: "follow" });
            const data = await response.json();

            if (!response.ok) {
                Swal.fire('Error!', `${data.message}`, 'error');
                setResponseError(data.message);
                throw new Error('Network response was not ok');
            }
            const myServices = data.data.services;

            const serviceOptions = myServices.map((service, index) => ({
                value: service.id,
                label: service.title,
                key: `${service.title}-${index}` // Ensure key is unique
            }));

            setServices(serviceOptions);
            // Update token if provided
            const newToken = data.token || data._token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            // Set SPOCs (assuming it's `services`)
            if (data.data.vendors) {
                setSpocs(data.data.vendors);
            } else {
                console.warn("No services found in response");
            }

        } catch (error) {
            console.error('Fetch error:', error);
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


    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const normalizedValue = name === 'scope_of_services' ? Number(value) : value;
    
        if (type === "checkbox") {
            if (name === 'scope_of_services') {
                setSelectedServices((prevData) => {
                    const existing = prevData[name] || [];
    
                    if (checked) {
                        if (!existing.includes(normalizedValue)) {
                            return {
                                ...prevData,
                                [name]: [...existing, normalizedValue],
                            };
                        }
                        return prevData;
                    } else {
                        return {
                            ...prevData,
                            [name]: existing.filter((v) => v !== normalizedValue),
                        };
                    }
                });
            } else {
                setFormData((prevData) => {
                    const existing = prevData[name] || [];
    
                    if (checked) {
                        if (!existing.includes(value)) {
                            return {
                                ...prevData,
                                [name]: [...existing, value],
                            };
                        }
                        return prevData;
                    } else {
                        return {
                            ...prevData,
                            [name]: existing.filter((v) => v !== value),
                        };
                    }
                });
            }
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };
    


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setApiLoading(true);

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        const raw = JSON.stringify({
            ...formData,
            ...(selectedServices?.scope_of_services ? { scope_of_services: selectedServices.scope_of_services.join(',') } : {}),
            admin_id,
            _token: storedToken,
        });


        const requestOptions = {
            method: isEditing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: raw,
        };

        const url = isEditing
            ? "https://api.screeningstar.co.in/internal-storage/vendor/update"
            : "https://api.screeningstar.co.in/internal-storage/vendor/create";

        try {
            const response = await fetch(url, requestOptions);

            // Extract response data
            const data = await response.json();
            const newToken = data.token || data._token || storedToken || "";
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (response.ok) {
                setLoading(false);
                setApiLoading(false);

                // Refresh data and reset form
                fetchData();
                setFormData({
                    vendor_name: "",
                    registered_address: "",
                    authorized_person_name: "",
                    authorized_person_designation: "",
                    mobile_number: "",
                    email_id: "",
                    spoc_name: "",
                    spoc_designation: "",
                    service_presence: "",
                    scope_of_services: "",
                    pricing: "",
                    turnaround_time: "",
                    standard_process: "",
                    vendor_status: "",
                    remarks: ""
                });
                setSelectedServices([]);
                setIsEditing(false);
                setCurrentSpocId(null);

                // Display success message dynamically
                Swal.fire(
                    "Success!",
                    isEditing ? "Form updated successfully." : "Form submitted successfully.",
                    "success"
                );
            } else {
                setLoading(false);
                setApiLoading(false);

                // Display error message dynamically
                const errorMessage = data.message || "Failed to submit form. Please try again.";
                Swal.fire("Error!", errorMessage, "error");
            }
        } catch (error) {
            setLoading(false);
            setApiLoading(false);

            // Catch unexpected errors
            Swal.fire("Error!", `An unexpected error occurred: ${error.message}`, "error");
            console.error("Error submitting form:", error);
        }
    };

    console.log(`services - `, services);

    const handleEdit = (spoc) => {
        if (clientEditRef.current) {
            clientEditRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        console.log('spoc', spoc);

        // Convert "2,4,6" => [2, 4, 6]
        const servicesArray = spoc.scope_of_services
            ? spoc.scope_of_services.split(',').map(Number)
            : [];

        // Update selectedServices with the parsed array
        setSelectedServices(prev => ({
            ...prev,
            scope_of_services: servicesArray
        }));

        setFormData(spoc);
        setIsEditing(true);
        setCurrentSpocId(spoc.id);
    };



    const handleDelete = async (id) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        const requestOptions = {
            method: "DELETE",
            redirect: "follow",
        };

        try {
            const willDelete = await swal({
                title: "Are you sure?",
                text: "Once deleted, you will not be able to recover this data!",
                icon: "warning",
                buttons: true,
                dangerMode: true,
            });

            if (willDelete) {
                setDeletingId(id);
                const response = await fetch(
                    `https://api.screeningstar.co.in/internal-storage/vendor/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`,
                    requestOptions
                );

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                // Remove the deleted SPOC from the state immediately
                setSpocs((prevSpocs) => prevSpocs.filter((spoc) => spoc.id !== id));
                swal("Deleted!", "The data has been deleted successfully.", "success");
                setDeletingId(null);
                const result = await response.json();
                const newToken = result.token || result._token || storedToken || "";
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
            }
        } catch (error) {
            swal("Failed!", "There was an error deleting the data.", "error");
            console.error("Delete request failed:", error);
            setDeletingId(null);
        }
    };
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSpocs = spocs
        .filter((spoc) => spoc?.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(indexOfFirstItem, indexOfLastItem);
    ;

    const totalPages = Math.ceil(spocs.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const filteredSpocs = spocs.filter((spoc) =>
        spoc.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log(filteredSpocs);
    const handleCancel = () => {
        fetchData();
        setFormData({
            vendor_name: "",
            registered_address: "",
            authorized_person_name: "",
            authorized_person_designation: "",
            mobile_number: "",
            email_id: "",
            spoc_name: "",
            spoc_designation: "",
            service_presence: "",
            scope_of_services: "",
            pricing: "",
            turnaround_time: "",
            standard_process: "",
            vendor_status: "",
            remarks: ""
        });
        setSelectedServices([]);

        setIsEditing(false);
        setCurrentSpocId(null);
    };
    console.log('SelectedServices', selectedServices)
    return (

        <div className=" ">
            <div className="bg-white  md:p-12 p-6 border border-black w-full mx-auto">
                <div className="md:flex space-x-4">

                    <div ref={clientEditRef} className="md:w-2/5">
                        <form className="space-y-4 ps-0 pb-[30px] md:pr-[30px] bg-white rounded-md" id="client-spoc" onSubmit={handleSubmit}>
                            {[
                                { label: "Vendor Name", name: "vendor_name" },
                                { label: "Registered Address", name: "registered_address" },
                                { label: "Authorized Person Name", name: "authorized_person_name" },
                                { label: "Authorized Person Designation", name: "authorized_person_designation" },
                                { label: "Mobile Number", name: "mobile_number" },
                                { label: "Email ID", name: "email_id" },
                                { label: "SPOC Name", name: "spoc_name" },
                                { label: "SPOC Designation", name: "spoc_designation" },
                                { label: "Service Presence", name: "service_presence" },
                                { label: "Scope of Services", name: "scope_of_services" },
                                { label: "Pricing", name: "pricing" },
                                { label: "Turnaround Time", name: "turnaround_time" },
                                { label: "Standard Process", name: "standard_process" },
                                { label: "Vendor Status", name: "vendor_status" },
                                { label: "Remarks", name: "remarks" }
                            ].map((field) => (
                                <div className="w-full" key={field.name}>
                                    <label htmlFor={field.name} className="block text-left w-full m-auto mb-2 text-gray-700">{field.label}</label>
                                    {field.name === "scope_of_services" ? (
                                        <div className="flex grid grid-cols-2 flex-col gap-2">
                                            {services.map((service) => (
                                                <label key={service.value} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        name="scope_of_services"
                                                        value={service.value}
                                                        checked={selectedServices?.scope_of_services?.includes(Number(service.value)) || false}
                                                        onChange={handleChange}
                                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">{service.label}</span>
                                                </label>
                                            ))}


                                        </div>



                                    ) : (
                                        <input
                                            type="text"
                                            name={field.name}
                                            placeholder={field.label}
                                            value={formData[field.name] || ""}
                                            onChange={handleChange}
                                            className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                                        />
                                    )}

                                </div>
                            ))}

<div className={"flex gap-2 justify-center"}>
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`px-8 py-3 bg-[#2c81ba]  w-full text-white font-bold rounded-md hover:bg-[#0f5381] hover:scale-105 transition flex justify-center text-center items-center  duration-200 ${loading ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                    >
                                        {isEditing ? "Edit" : "Submit"}
                                    </button>
                                </div>

                                {!isEditing && (
                                    <div className='flex items-center gap-7'>
                                        <div>
                                            <h3 className='text-xl font-bold'>OR</h3>
                                        </div>
                                        <button
                                            onClick={() => navigate('/admin-VendorBulk')}
                                            disabled={loading}
                                            className={`p-6 py-3 bg-[#2c81ba] text-white hover:scale-105 font-bold  transition duration-200  rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Bulk Upload
                                        </button>
                                    </div>
                                )}

                                {isEditing && (
                                    <div>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className={`p-6 py-3 bg-red-500 text-white font-bold rounded-md hover:bg-red-600 hover:scale-105 transition flex justify-center text-center items-center w-full duration-200 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            CANCEL
                                        </button>
                                    </div>

                                )}

                            </div>
                        </form>


                    </div>
                    <div className="md:w-3/5 overflow-x-auto no-margin">
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search by Vendor Name"
                                className="w-full rounded-md p-2.5 border border-gray-300"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="overflow-auto">
                            <table className="min-w-full border-collapse border border-black rounded-lg">
                                <thead className="rounded-lg border border-black">
                                    <tr className="bg-[#c1dff2] text-[#4d606b] text-left rounded-lg whitespace-nowrap">
                                        <th className="uppercase border border-black px-4 py-2">Sl No.</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Vendor Name</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Registered Address</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Authorized Person Name</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Authorized Person Designation</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Mobile Number</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Email ID</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">SPOC Name</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">SPOC Designation</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Service Presence</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Scope of Services</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Pricing</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Turnaround Time</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Standard Process</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Vendor Status</th>
                                        <th className="uppercase border border-black px-4 py-2 text-left">Remarks</th>
                                        <th className="py-2 px-4 border border-black text-center uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={17} className="py-4 text-center text-gray-500">
                                                <Loader className="text-center" />
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {currentSpocs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={17} className="py-4 text-center text-red-500">
                                                        {responseError && responseError !== "" ? responseError : "No data available in table"}
                                                    </td>
                                                </tr>
                                            ) : (
                                                currentSpocs.map((spoc, index) => (
                                                    <tr key={spoc.id} className="hover:bg-gray-200">
                                                        <td className="py-2 px-4 border border-black">{index + indexOfFirstItem + 1}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.vendor_name}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.registered_address}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.authorized_person_name}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.authorized_person_designation}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.mobile_number}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.email_id}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.spoc_name}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.spoc_designation}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.service_presence}</td>
                                                        <td className="border border-black px-4 py-2 text-center">
                                                            <div className="flex items-center">
                                                                {spoc.scope_of_services ? (() => {
                                                                    const selectedIds = spoc.scope_of_services.split(',').map(id => parseInt(id.trim()));
                                                                    const matchedServices = services
                                                                        .filter(service => selectedIds.includes(service.value))
                                                                        .map(s => ({ serviceTitle: s.label }));

                                                                    return matchedServices.length > 0 ? (
                                                                        <>
                                                                            <span className="px-4 py-2 bg-blue-100 whitespace-nowrap border border-blue-500 rounded-lg text-sm">
                                                                                {matchedServices[0].serviceTitle}
                                                                            </span>
                                                                            {matchedServices.length > 1 && (
                                                                                <button
                                                                                    className="text-blue-500 whitespace-nowrap ml-2"
                                                                                    onClick={() => handleViewMore(matchedServices)}
                                                                                >
                                                                                    View More
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg">
                                                                            No Services Available
                                                                        </span>
                                                                    );
                                                                })() : (
                                                                    <span className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg">
                                                                        No Services Available
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="border border-black px-4 py-2 text-left">{spoc.pricing}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.turnaround_time}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.standard_process}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.vendor_status}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{spoc.remarks}</td>
                                                        <td className="py-2 px-4 border border-black whitespace-nowrap">
                                                            <button className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded mr-2" onClick={() => handleEdit(spoc)}>Edit</button>
                                                            <button
                                                                disabled={deletingId === spoc.id}
                                                                className={`bg-red-500 hover:scale-105 hover:bg-red-600 text-white px-4 py-2 rounded ${deletingId === spoc.id ? "opacity-50 cursor-not-allowed" : ""} `}
                                                                onClick={() => handleDelete(spoc.id)}>
                                                                {deletingId === spoc.id ? "Deleting..." : "Delete"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>

                        </div>
                        <div className="flex justify-center mt-4">
                            {Array.from({ length: totalPages }, (_, index) => (
                                <button
                                    key={index + 1}
                                    className={`px-3 py-1 border rounded ${currentPage === index + 1 ? "bg-[#2c81ba] hover:bg-[#0f5381] text-white" : ""}`}
                                    onClick={() => handlePageChange(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-999">
                    <div className="bg-white rounded-lg shadow-lg p-4 md:mx-0 mx-4 md:w-1/3">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold">Services</h2>
                            <button className="text-red-500 text-2xl" onClick={handleCloseServiceModal}>
                                &times;
                            </button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 w-full max-h-96 overflow-y-auto">
                            {modalServices.length > 0 ? (
                                modalServices.map((service, idx) => (
                                    <span
                                        key={idx}
                                        className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm"
                                    >
                                        {service.serviceTitle}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500">No service available</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>

    );
};

export default Vendors;
