import { React, useState, useEffect, useCallback } from 'react'
import "react-datepicker/dist/react-datepicker.css";
import { MultiSelect } from "react-multi-select-component";
import { State } from "country-state-city";
import SelectSearch from 'react-select-search';
import 'react-select-search/style.css'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { useClientContext } from "./ClientContext";
import { FaChevronLeft } from 'react-icons/fa';

const states = State.getStatesOfCountry("IN");
const option = states.map((state) => ({ value: state.isoCode, label: state.name }));
const EditClient = () => {
    const navigate = useNavigate();

    const [priceData, setPriceData] = useState({});
    const [files, setFiles] = useState([]);
    const [selectedServices, setSelectedServices] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [errors, setErrors] = useState({});
    const [emails, setEmails] = useState([]);
    const { services, client_spoc_id, AllSpocs, escalation_manager_id, packageList, billing_spoc_id, billing_escalation_id, authorized_detail_id, visible_fields, dedicated_point_of_contact,
        first_level_matrix_name,
        first_level_matrix_designation,
        first_level_matrix_mobile,
        first_level_matrix_email, selectedClient, role, setSelectedClient } = useClientContext();

    if (typeof selectedClient.visible_fields === 'string') {
        // Parse and replace with old one
        selectedClient.visible_fields = JSON.parse(selectedClient.visible_fields);
        console.log('Updated visible_fields', selectedClient.visible_fields);
    }
    const memoizedAllSpocs = useCallback(() => {
        AllSpocs(); // Call the original AllSpocs function
    }, [AllSpocs]); // Only recreate this function if AllSpocs changes

    useEffect(() => {
        memoizedAllSpocs(); // This will now run only once unless AllSpocs itself changes
    }, [memoizedAllSpocs]);

    useEffect(() => {
        // Check if selectedClient.emails is defined and not null
        if (selectedClient?.emails) {
            // Parse and set emails array from selectedClient
            setEmails(JSON.parse(selectedClient.emails));
        }
    }, [selectedClient?.emails]);

    const checkServiceById = useCallback((selectedClientForFunction, serviceId, groupId) => {

        const clientPreSelectedServicesRaw = selectedClientForFunction?.services
            ? typeof selectedClientForFunction.services === 'string'
                ? JSON.parse(selectedClientForFunction.services)
                : selectedClientForFunction.services
            : null;

        // Find the specified group by `groupId`
        const groupWithService = clientPreSelectedServicesRaw?.find(group =>
            group.group_id === groupId && group.services?.some(service => service.serviceId === serviceId)
        );


        if (groupWithService) {
            const service = groupWithService.services.find(s => s.serviceId === serviceId);
            return {
                status: true,
                price: service.price,
                packages: service.packages
            };
        }

        return { status: false };
    }, []);

    const deleteService = (selectedClientForFunction, group_id, serviceId) => {
        console.log("Input Parameters:", { selectedClientForFunction, group_id, serviceId });

        const clientPreSelectedServicesRaw = selectedClientForFunction?.services
            ? typeof selectedClientForFunction.services === 'string'
                ? JSON.parse(selectedClientForFunction.services)
                : selectedClientForFunction.services
            : null;

        console.log("Parsed clientPreSelectedServicesRaw:", clientPreSelectedServicesRaw);

        if (!Array.isArray(clientPreSelectedServicesRaw)) {
            console.warn("Invalid services data, exiting function.");
            return; // Early return or handle the error as needed
        }

        // Create a new array with the service deleted
        const updatedClientData = clientPreSelectedServicesRaw.map(group => {
            console.log("Processing group:", group);

            // Check if the group_id matches
            if (group.group_id === group_id) {
                console.log("Match found for group_id:", group_id);

                // Filter out the service by serviceId
                const updatedServices = group.services.filter(service => service.serviceId !== serviceId);
                console.log("Updated services for group:", updatedServices);

                // Return the updated group with the filtered services
                return { ...group, services: updatedServices };
            }

            console.log("Group does not match group_id, returning as is:", group);
            return group; // Return the group as is if it doesn't match the group_id
        });

        console.log("Updated client data after processing groups:", updatedClientData);

        // After updating, set the new state
        setSelectedClient((prev) => {
            const newState = {
                ...prev,
                services: JSON.stringify(updatedClientData),
            };
            console.log("updatedClientData", updatedClientData);
            return newState;
        });
    };





    console.log(selectedClient.visible_fields);
    const handleChange = (e, selectedOptions = null) => {
        if (selectedOptions) {
            // If selectedOptions is provided (i.e., for MultiSelect change), update visible_fields
            setSelectedClient((prevData) => ({
                ...prevData,
                visible_fields: selectedOptions.map(opt => opt.value), // Store only values from MultiSelect
            }));
        } else {
            // For regular input fields, ensure e is not null
            const { name, value, type, files } = e ? e.target : {}; // Safely destructure e.target if e is not null
            setSelectedClient((prevData) => ({
                ...prevData,
                [name]: type === "file" ? files[0] : value, // Handle file input
            }));
        }
    };

    console.log('myselected client', selectedClient);
    const handleFileChange = (fileName, e) => {
        const selectedFiles = Array.from(e.target.files); // Convert FileList to an array

        // Assuming `file` is the state variable holding the files
        setFiles((prevFiles) => {
            return {
                ...prevFiles,
                [fileName]: selectedFiles,
            };
        });
    };

    const uploadCustomerLogo = async (adminId, token) => {
        // If token is not provided, check if it exists in localStorage
        const newToken = token || localStorage.getItem('_token');

        // If a new token is found in the response, store it in localStorage
        if (newToken) {
            localStorage.setItem('_token', newToken);
        }

        const fileCount = Object.keys(files).length;
        for (const [index, [key, value]] of Object.entries(files).entries()) {
            const customerLogoselectedClient = new FormData();
            customerLogoselectedClient.append('admin_id', adminId);
            customerLogoselectedClient.append('_token', newToken); // Use the token from localStorage
            customerLogoselectedClient.append('customer_code', selectedClient.client_unique_id);
            customerLogoselectedClient.append('customer_id', selectedClient.main_id);

            for (const file of value) {
                customerLogoselectedClient.append('images', file);
                customerLogoselectedClient.append('upload_category', key);
            }

            if (fileCount === (index + 1)) {
                customerLogoselectedClient.append('company_name', selectedClient.name);
            }

            try {
                await axios.post(
                    `https://api.screeningstar.co.in/customer/upload`,
                    customerLogoselectedClient,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
            } catch (err) {
                Swal.fire('Error!', `An error occurred while uploading logo: ${err.message}`, 'error');
            }
        }
    };




    const handleCheckboxChange = (selectedClientForFunction, { group_id, group_symbol, service_code, group_name, service_id, service_name, price, selected_packages }) => {
        // Check service by ID
        const { status, priceOld, packages } = checkServiceById(selectedClientForFunction, service_id, group_id);

        if (status) {
            deleteService(selectedClientForFunction, group_id, service_id)
        }

        const dataToSend = {
            group_id,
            group_symbol,
            service_code,
            group_name,
            service_id,
            service_name,
            price: status ? price : "", // Send empty if deselected
            selected_packages: status ? selected_packages : [], // Send empty if deselected
            action: "checkbox_change"
        };

        sendDataToServer(dataToSend);
    };


    const handlePriceChange = (e, service_id) => {
        const newPrice = e.target.value;

        setPriceData(prevPriceData => ({
            ...prevPriceData,
            [service_id]: {
                ...prevPriceData[service_id],
                pricingPackages: newPrice
            }
        }));

        // Send the updated price when user types or focuses out
        sendDataToServer({
            service_id,
            price: newPrice,
            action: "price_change",
        });
    };

    // 3. Handle package selection change (when packages are selected or changed)
    const handlePackageChange = (selectedList, serviceId) => {

        // Create an array of selected packages in the desired format
        const selectedPackagesData = selectedList.map(pkg => ({
            id: pkg.value,
            name: pkg.label
        }));

        setSelectedPackages(prevSelected => ({
            ...prevSelected,
            [serviceId]: selectedList.map(pkg => pkg.value) // Store only the selected package IDs
        }));
        // Now, send the selected packages data
        const dataToSend = {
            action: 'package_change',
            service_id: serviceId,
            selected_packages: selectedPackagesData
        };

        // Call sendDataToServer to handle the update
        sendDataToServer(dataToSend);
    };


    function updateServiceById(serviceId, updatedInfo) {




        // Parse selectedClient's services only if it's valid (non-null, non-undefined)
        const clientPreSelectedServicesRaw = selectedClient?.services ? JSON.parse(selectedClient.services) : null;

        for (let group of clientPreSelectedServicesRaw) {


            if (group.services) {
                const service = group.services.find(service => service.serviceId === serviceId);

                if (service) {
                    // Update the fields in the service object with the values in updatedInfo
                    Object.assign(service, updatedInfo);
                    setSelectedClient((prev) => ({
                        ...prev,
                        services: JSON.stringify(clientPreSelectedServicesRaw),
                    }));
                    return true;  // Return true if update was successful
                }
            }
        }

        // If service is not found, create a new service and add it to the appropriate group


        const newService = {
            serviceId,
            serviceTitle: updatedInfo.serviceTitle || '',
            serviceCode: updatedInfo.service_code || "",
            price: updatedInfo.price || '',
            packages: updatedInfo.packages || []  // Assuming updatedInfo includes packages
        };

        // Add the new service to the correct group
        const groupIndex = clientPreSelectedServicesRaw.findIndex(group => group.group_id === updatedInfo.group_id);
        if (groupIndex !== -1) {
            clientPreSelectedServicesRaw[groupIndex].services.push(newService);  // Add the new service to the found group
        } else {
            // If the group is not found, you can add a new group, or handle it differently based on your needs
            clientPreSelectedServicesRaw.push({
                group_id: updatedInfo.group_id,
                group_title: updatedInfo.group_name,
                group_symbol: updatedInfo.group_symbol,
                services: [newService]
            });
        }

        // Update the clientData.scopeOfServices directly
        setSelectedClient((prev) => ({
            ...prev,
            services: JSON.stringify(clientPreSelectedServicesRaw),
        }));


        return true;
    }


    // Function to send data to the server (or perform any other action you need)
    const sendDataToServer = (data) => {

        let sendDataRunning = false;
        let updatedData = {};

        // Handle the different actions
        switch (data.action) {
            case 'package_change':
                updatedData = { packages: data.selected_packages };  // Assuming you want to update packages
                sendDataRunning = true;
                break;
            case 'checkbox_change':
                const { selected_packages, group_id, group_name, group_symbol, service_code, price, service_name } = data;
                updatedData = { selected_packages, group_id, group_name, group_symbol, service_code, price, serviceTitle: service_name };
                sendDataRunning = true;
                break;
            case 'price_change':

                updatedData = { price: data.price };  // Only updating price
                sendDataRunning = true;
                break;
            default:

                break;
        }

        if (sendDataRunning) {
            const serviceId = data.service_id;
            const isUpdated = updateServiceById(serviceId, updatedData);  // Update service with serviceId


        } else {

        }
    };


    const validateRequiredFields = () => {
        const requiredFields = [
            "name", "client_unique_id", "address", "state", "state_code", "gst_number",
            "tat_days", "agreement_duration", "client_standard", "agreement_date",
            "mobile", "role", "client_spoc_id", "escalation_manager_id", "billing_spoc_id",
            "billing_escalation_id", "authorized_detail_id", "visible_fields", "dedicated_point_of_contact",
            "first_level_matrix_name",
            "first_level_matrix_designation",
            "first_level_matrix_mobile",
            "first_level_matrix_email",
        ];

        const newErrors = {};
        console.log("Validating fields for selectedClient:", selectedClient);

        // Validate clientData fields
        requiredFields.forEach(field => {
            const fieldValue = selectedClient[field];
            if (!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)) {
                console.log(`Validation error for field: ${field}`);
                newErrors[field] = "This field is required";
            }
        });

        // Conditionally validate username based on additional_login
        if (selectedClient?.additional_login === '1') {
            const username = selectedClient.username;
            if (!username) {
                console.log("Validation error for username: This field is required");
                newErrors.username = "This field is required";
            }
        }

        // Validate emails
        if (!emails || emails.length === 0) {
            console.log("Validation error: emails array is empty or undefined");
            newErrors.emails = "At least one email is required";
        } else {
            emails.forEach((email, index) => {
                console.log(`Validating email[${index}]: ${email}`);
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email)) {
                    console.log(`Validation error for email[${index}]: Invalid email format`);
                    newErrors[`email_${index}`] = "Invalid email format";
                }
            });
        }

        setErrors(newErrors);
        console.log("Validation errors:", newErrors);
        return newErrors;
    };


    console.log('errors', errors);

    const handleSubmit = async (e) => {
        e.preventDefault();
        let validationErrors = validateRequiredFields();
        setLoading(true);
        // If there are validation errors, show an alert and stop submission
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;  // Stop submission if there are validation errors
        }

        try {
            // Retrieve necessary data from localStorage
            const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
            const storedToken = localStorage.getItem("_token");
            const additionalLoginValue = selectedClient?.additional_login === 1 ? "yes" : "no";
            // Prepare the payload with all necessary data
            const payload2 = JSON.stringify({
                admin_id: admin_id,
                _token: storedToken,
                ...selectedClient,
                visible_fields: selectedClient.visible_fields,
                customer_id: selectedClient.main_id,
                emails,   // Ensure `date` is correctly defined or passed in
                additional_login: additionalLoginValue,
            });

            // Set up request headers
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            // Define the request options
            const requestOptions = {
                method: "PUT",
                headers: myHeaders,
                body: payload2,
                redirect: "follow",
            };

            // Make the API call
            const response = await fetch("https://api.screeningstar.co.in/customer/update", requestOptions);
            const result = await response.json();
            const newToken = result.token || result._token || storedToken || '';
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }
            // Check if the response is successful
            if (!response.ok) {
                setLoading(false);

                throw new Error('Failed to submit the form');
            }

            // Handle the response
            Swal.fire("Success", result.message, "success")
            navigate('/admin-active-account')

            // If the response includes a new token, store it


            // Proceed with uploading the logo or any other necessary action
            uploadCustomerLogo(admin_id, storedToken);
            // Clear selected package options
            setSelectedOption(null); // Reset login requirement option

        } catch (error) {
            setLoading(false);

            // Handle error and set error state
            console.error('Submission error:', error);
        }
        setLoading(false);

        // Clear any previous API errors

    };
    const handleGoBack = () => {
        navigate('/admin-active-account');
    };
    return (
        <div className="bg-[#c1dff2] ">
            <div className="bg-white p-10  border w-full mx-auto">

                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <div className='py-8' >
                    <form onSubmit={handleSubmit} className="bg-white p-6  shadow-md">

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium">Name of the Organization</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter Organization Name"
                                    value={selectedClient?.name}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.name ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.name && <span className="text-red-500">{errors.name}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">Client Unique ID</label>
                                <input
                                    type="text"
                                    name="client_unique_id"
                                    placeholder="Enter Client Unique ID"
                                    value={selectedClient?.client_unique_id}
                                    onChange={handleChange}
                                    disabled
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.client_unique_id ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.client_unique_id && <span className="text-red-500">{errors.client_unique_id}</span>}
                            </div>
                        </div>

                        {/* Registered Address */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium">Registered Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Enter Registered Address"
                                    value={selectedClient?.address}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.address ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.address && <span className="text-red-500">{errors.address}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">State</label>
                                <div className="relative">
                                    <select
                                        name="state"
                                        value={selectedClient?.state || ""}
                                        onChange={handleChange}
                                        className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.state ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb] appearance-none pr-8`}
                                    >
                                        <option value="" className="text-[#989fb3]">
                                            Select State
                                        </option>
                                        {option.map((opt) => (
                                            <option key={opt.value} value={opt.value} className="text-black">
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.state && <span className="text-red-500">{errors.state}</span>}
                                </div>
                            </div>
                        </div>

                        {/* State Code and GST Number */}
                        <div className="grid mb-[30px] grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium">State Code</label>
                                <input
                                    type="text"
                                    name="state_code"
                                    placeholder="Enter State Code"
                                    value={selectedClient?.state_code}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.state_code ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">GST Number</label>
                                <input
                                    type="text"
                                    name="gst_number"
                                    placeholder="Enter GST Number"
                                    value={selectedClient?.gst_number}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.gst_number ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.gst_number && <span className="text-red-500">{errors.gst_number}</span>}
                            </div>
                        </div>

                        {/* Mobile Number and TAT */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium">Mobile Number</label>
                                <input
                                    type="text"
                                    name="mobile"
                                    placeholder="Enter Mobile Number"
                                    value={selectedClient?.mobile}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.mobile ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.mobile && <span className="text-red-500">{errors.mobile}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">Email</label>
                                <input
                                    type="text"
                                    name="emails"
                                    placeholder="Enter Email"
                                    value={emails[0] || ""}
                                    onChange={(e) => setEmails([e.target.value])}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.emails ? "border-red-500" : "border-gray-300"
                                        } bg-[#f7f6fb]`}
                                />
                                {errors.emails && <span className="text-red-500">{errors.emails}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium">Service Agreement Date</label>
                                <input
                                    type="date"
                                    onChange={handleChange}
                                    value={selectedClient?.agreement_date ? new Date(selectedClient.agreement_date).toISOString().split('T')[0] : ""}
                                    name="agreement_date"
                                    placeholder="Select Service Agreement Date"
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.agreement_date ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />

                                {errors.agreement_date && <span className="text-red-500">{errors.agreement_date}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">TAT (Turnaround Time)</label>
                                <input
                                    type="text"
                                    name="tat_days"
                                    placeholder="Enter TAT"
                                    value={selectedClient?.tat_days}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.tat_days ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.tat_days && <span className="text-red-500">{errors.tat_days}</span>}
                            </div>

                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium">Client Procedure</label>
                                <input
                                    type="text"
                                    name="client_standard"
                                    placeholder="Enter Client Procedure"
                                    value={selectedClient?.client_standard}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.client_standard ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">Agreement Period</label>
                                <select
                                    name="agreement_duration"
                                    value={selectedClient?.agreement_duration || ""}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.agreement_duration ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                >
                                    <option value="" className="text-[#989fb3]">
                                        Select Agreement Period
                                    </option>
                                    <option value="1 Year">1 Year</option>
                                    <option value="2 Years">2 Years</option>
                                    <option value="3 Years">3 Years</option>
                                    {/* Add more options as needed */}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <label className="block mb-1 text-sm font-medium">Client Logo</label>
                                <input type="file" name="logo" onChange={(e) => handleFileChange('logo', e)} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                <img
                                    src={`${selectedClient?.logo}`}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">Role</label>
                                <input type="text" name="role" value={selectedClient?.role} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                {errors.role && <span className="text-red-500">{errors.role}</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">
                                    Dedicated Point Of Contact
                                </label>
                                <input
                                    type="text"
                                    name="dedicated_point_of_contact"
                                    value={selectedClient?.dedicated_point_of_contact}
                                    onChange={handleChange}
                                    className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                />
                                {errors.dedicated_point_of_contact && <span className="text-red-500">{errors.dedicated_point_of_contact}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">
                                    First Level Matrix Name
                                </label>
                                <input
                                    type="text"
                                    name="first_level_matrix_name"
                                    value={selectedClient?.first_level_matrix_name}
                                    onChange={handleChange}
                                    className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                />
                                {errors.first_level_matrix_name && <span className="text-red-500">{errors.first_level_matrix_name}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">
                                    First Level Matrix Designation
                                </label>
                                <input
                                    type="text"
                                    name="first_level_matrix_designation"
                                    value={selectedClient?.first_level_matrix_designation}
                                    onChange={handleChange}
                                    className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                />
                                {errors.first_level_matrix_designation && <span className="text-red-500">{errors.first_level_matrix_designation}</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">
                                    First Level Matrix Mobile
                                </label>
                                <input
                                    type="text"
                                    name="first_level_matrix_mobile"
                                    value={selectedClient?.first_level_matrix_mobile}

                                    onChange={handleChange}
                                    className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                />
                                {errors.first_level_matrix_mobile && <span className="text-red-500">{errors.first_level_matrix_mobile}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">
                                    First Level Matrix Email
                                </label>
                                <input
                                    type="text"
                                    name="first_level_matrix_email"
                                    placeholder='You can add multiple emails by , '
                                    value={selectedClient?.first_level_matrix_email}

                                    onChange={handleChange}
                                    className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                />
                                {errors.first_level_matrix_email && <span className="text-red-500">{errors.first_level_matrix_email}</span>}
                            </div>


                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium">Escalation Manager</label>
                                <SelectSearch
                                    options={escalation_manager_id}
                                    value={selectedClient?.escalation_manager_id}
                                    name="escalation_manager_id"
                                    placeholder="Choose your language"
                                    onChange={(value) => handleChange({ target: { name: "escalation_manager_id", value } })}
                                    search
                                />
                                {errors.escalation_manager_id && <span className="text-red-500">{errors.escalation_manager_id}</span>}

                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium">Client Spoc</label>
                                <SelectSearch
                                    options={client_spoc_id}
                                    value={selectedClient?.client_spoc_id}
                                    name="client_spoc_id"
                                    placeholder="Choose your language"
                                    onChange={(value) => handleChange({ target: { name: "client_spoc_id", value } })}
                                    search
                                />
                                {errors.client_spoc_id && <span className="text-red-500">{errors.client_spoc_id}</span>}

                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium">Billing Spoc</label>
                                <SelectSearch
                                    options={billing_spoc_id}
                                    value={selectedClient?.billing_spoc_id}
                                    name="billing_spoc_id"
                                    placeholder="Choose your language"
                                    onChange={(value) => handleChange({ target: { name: "billing_spoc_id", value } })}
                                    search
                                />
                                {errors.billing_spoc_id && <span className="text-red-500">{errors.billing_spoc_id}</span>}

                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium">Billing Escalation</label>
                                <SelectSearch
                                    options={billing_escalation_id}
                                    value={selectedClient?.billing_escalation_id}
                                    name="billing_escalation_id"
                                    placeholder="Choose your language"
                                    onChange={(value) => handleChange({ target: { name: "billing_escalation_id", value } })}
                                    search
                                />
                                {errors.billing_escalation_id && <span className="text-red-500">{errors.billing_escalation_id}</span>}

                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium">Authorized Details</label>

                                <SelectSearch
                                    options={authorized_detail_id}
                                    value={selectedClient?.authorized_detail_id}
                                    name="authorized_detail_id"
                                    placeholder="Choose your language"
                                    onChange={(value) => handleChange({ target: { name: "authorized_detail_id", value } })}
                                    search
                                />
                                {errors.authorized_detail_id && <span className="text-red-500">{errors.authorized_detail_id}</span>}

                            </div>
                        </div>
                        <div className="grid gap-4 mb-4">
                            <div>
                                <label className="block mb-1 font-medium">
                                    Visible Fields<span className="text-red-500 text-xl" >*</span>
                                </label>
                                <MultiSelect
                                    className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                    options={[
                                        { value: "batch_No", label: "Batch No" },
                                        { value: "case_id", label: "Case ID" },
                                        { value: "check_id", label: "Check ID" },
                                        { value: "ticket_id", label: "Ticket ID" },
                                        { value: "sub_client", label: "Sub Client" },
                                        { value: "gender_male", label: "Gender Male" },
                                        { value: "gender_female", label: "Gender Female" },
                                        { value: "photo", label: "Photo" },
                                        { value: "location", label: "Location" },
                                        { value: "client_ref_id", label: "Client Ref ID" },
                                    ]}
                                    value={Array.isArray(selectedClient?.visible_fields) ? selectedClient.visible_fields.map(value => ({
                                        value: value,
                                        label: [
                                            { value: "batch_No", label: "Batch No" },
                                            { value: "case_id", label: "Case ID" },
                                            { value: "check_id", label: "Check ID" },
                                            { value: "ticket_id", label: "Ticket ID" },
                                            { value: "sub_client", label: "Sub Client" },
                                            { value: "gender_male", label: "Gender Male" },
                                            { value: "gender_female", label: "Gender Female" },
                                            { value: "photo", label: "Photo" },
                                            { value: "location", label: "Location" },
                                            { value: "client_ref_id", label: "Client Ref ID" },
                                        ].find(option => option.value === value)?.label || value,
                                    })) : []}
                                    search
                                    onChange={(selectedOptions) => handleChange(null, selectedOptions)}
                                />



                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="additional-login"
                                    className="block mb-1 text-sm font-medium"
                                >
                                    Login Required Option
                                </label>
                                <select
                                    id="additional-login"
                                    name="additional_login" // Add name attribute for consistency
                                    value={selectedClient?.additional_login ?? ""} // Use nullish coalescing for fallback
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-5 border ${errors.additional_login ? "border-red-500" : "border-gray-300"
                                        } bg-[#f7f6fb]`}
                                >
                                    <option value="">
                                        Select an option
                                    </option>
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>

                                {errors.additional_login && (
                                    <span className="text-red-500 text-sm">{errors.additional_login}</span>
                                )}
                            </div>



                            {/* Conditionally render the username input when "yes" is selected */}
                            {selectedClient?.additional_login == "1" && (
                                <div className="mt-0">
                                    <label className="block mb-1 text-sm font-medium">username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={selectedClient?.username}
                                        onChange={handleChange}
                                        className="w-full rounded-md p-2.5 border border-gray-300 bg-[#f7f6fb]"
                                        placeholder="Enter username"
                                    />
                                </div>
                            )}


                            <div>
                                <label className="block mb-1 text-sm font-medium">Standard Process</label>
                                <input
                                    type="text"
                                    name="client_standard"
                                    placeholder="Enter Standard Process"
                                    value={selectedClient?.client_standard}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.client_standard ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.client_standard && <span className="text-red-500">{errors.client_standard}</span>}
                            </div>
                        </div>

                        <div className="clientserviceTable">

                            <div className="overflow-x-auto py-6 px-0 bg-white mt-10 m-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className='bg-[#c1dff2] text-[#4d606b]'>
                                            <th className="py-2 md:py-3 px-4 border-r border-b text-left uppercase whitespace-nowrap">Group</th>
                                            <th className="py-2 md:py-3 px-4 border-r border-b text-left uppercase whitespace-nowrap">Service code</th>
                                            <th className="py-2 md:py-3 px-4 border-r border-b text-left uppercase whitespace-nowrap">Verification Service</th>
                                            <th className="py-2 md:py-3 px-4 border-r border-b text-left uppercase whitespace-nowrap">Price</th>
                                            <th className="py-2 md:py-3 px-4 border-r border-b text-left uppercase whitespace-nowrap">Select Package</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {services.reduce((acc, item, index) => {
                                            const isSameGroup = index > 0 && item.group_title === services[index - 1].group_title;

                                            if (item.services.length > 0) {
                                                if (!isSameGroup) {
                                                    acc.push(
                                                        <tr key={`group-${item.group_id}`} className='bg-[#c1dff2] text-[#4d606b]'>
                                                            <th className="py-2 md:py-3 px-4 border-r border-b text-center uppercase whitespace-nowrap">
                                                                {item.symbol}
                                                            </th>
                                                            <th colSpan={4} className="py-2 md:py-3 px-4 border-r border-b text-center uppercase whitespace-nowrap">
                                                                {item.group_title}
                                                            </th>
                                                        </tr>
                                                    );
                                                }

                                                item.services.forEach((service, serviceIndex) => {
                                                    const serviceNumber = serviceIndex + 1;

                                                    const { status, price, packages } = checkServiceById(selectedClient, service.service_id, item.group_id);
                                                    console.log('service', selectedClient)
                                                    acc.push(
                                                        <tr key={`${item.group_id}-${service.service_id}`}>
                                                            <td className="py-2 md:py-3 px-4 border-l border-r border-b whitespace-nowrap"></td>
                                                            <td className="py-2 md:py-3 px-4 border-l border-r border-b whitespace-nowrap">
                                                                {service.service_code}
                                                            </td>
                                                            <td className="py-2 md:py-3 px-4 border-l border-r border-b whitespace-nowrap">
                                                                <div key={service.service_id}>
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`scope_${service.service_id}`}
                                                                        name="services"
                                                                        checked={status || false}
                                                                        onChange={() => handleCheckboxChange(selectedClient, {
                                                                            group_id: item.group_id,
                                                                            group_symbol: item.symbol,
                                                                            service_code: service.service_code,
                                                                            group_name: item.group_title,
                                                                            service_id: service.service_id,
                                                                            service_name: service.service_title,
                                                                            price: priceData[service.service_id]?.pricingPackages || '',
                                                                            selected_packages: status[service.service_id] || []
                                                                        })}
                                                                        className="mr-2"
                                                                    />
                                                                    <label htmlFor={`scope_${service.service_id}`} className="ml-2">{service.service_title}</label>
                                                                </div>
                                                            </td>

                                                            <td className="py-2 md:py-3 px-4 border-r border-b whitespace-nowrap">
                                                                <input
                                                                    type="number"
                                                                    name="pricingPackages"
                                                                    value={price || ""}
                                                                    onChange={(e) => handlePriceChange(e, service.service_id)}
                                                                    className='outline-none'
                                                                    disabled={!status}
                                                                    onBlur={(e) => handlePriceChange(e, service.service_id)}  // Send on blur/focus out
                                                                />
                                                            </td>
                                                            <td className="py-2 md:py-3 px-4 border-r border-b whitespace-nowrap uppercase text-left">
                                                                <MultiSelect
                                                                    options={packageList.map(pkg => ({ value: pkg.id, label: pkg.title }))}
                                                                    value={Array.isArray(packages) ? packages.map(pkg => ({
                                                                        value: pkg.id,
                                                                        label: pkg.name
                                                                    })) : []}


                                                                    onChange={(selectedList) => handlePackageChange(selectedList, service.service_id)}
                                                                    labelledBy="Select"
                                                                    disabled={!status} // Enable if service is selected
                                                                    className='uppercase'
                                                                />
                                                            </td>

                                                        </tr>
                                                    );
                                                });
                                            }

                                            return acc;
                                        }, [])}
                                    </tbody>

                                </table>

                            </div>
                        </div>


                        <div className="mt-4">
                            <button type="submit" className={`p-6 py-3 bg-[#2c81ba] text-white  hover:scale-105  font-bold rounded-md hover:bg-[#0f5381] transition duration-200r ${loading ? "opacity-50 cursor-not-allowed" : ""
                                }`}>Update</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditClient