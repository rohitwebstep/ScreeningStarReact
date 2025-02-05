import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2'
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css'; // Correct import path for CSS
import { Navigation, Thumbs } from 'swiper'; // Import modules directly
import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
const GenerateReport = () => {
    const navigate = useNavigate();
    const [submittedData, setSubmittedData] = useState(null); // State to hold submitted data
    const [files, setFiles] = useState([]);
    const [serpreviewfiles, setSerpreviewfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [servicesForm, setServicesForm] = useState('');
    const [applicationRefID, setApplicationRefID] = useState('');
    const [servicesDataInfo, setServicesDataInfo] = useState('');
    const [servicesData, setServicesData] = useState([]);
    const [branchInfo, setBranchInfo] = useState([]);
    const [customerInfo, setCustomerInfo] = useState([]);
    const [referenceId, setReferenceId] = useState("");
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [adminDataList, setAdminDataList] = useState([]);
    const [adminNames, setAdminNames] = useState([]);
    const [errors, setErrors] = useState({});
    const inputRefs = useRef({});
    const [myDataQc, setMyDataQc] = useState("");
    const [cmtData, setCmtData] = useState([]);

    const [cmdDates, setCmdDates] = useState({
        dob: "",
        initiationDate: "",
    });
    console.log('serpreviewfiles----', serpreviewfiles)
    const [isNotMandatory, setIsNotMandatory] = useState(false);
    const [formData, setFormData] = useState({
        updated_json: {
            insuffDetails: {
                first_insufficiency_marks: '',
                first_insuff_date: '',
                first_insuff_reopened_date: '',
                second_insufficiency_marks: '',
                second_insuff_date: '',
                second_insuff_reopened_date: '',
                third_insufficiency_marks: '',
                third_insuff_date: '',
                third_insuff_reopened_date: '',
                overall_status: '',
                report_date: '',
                report_status: '',
                report_type: '',
                final_verification_status: '',
                is_verify: '',
                deadline_date: '',
                insuff_address: '',
                basic_entry: '',
                education: '',
                case_upload: '',
                emp_spoc: '',
                report_generate_by: '',
                qc_done_by: '',
                qc_date: '',
                delay_reason: '',
            },
        },
    });


    const openModal = (image) => {
        setSelectedImage(`${image.trim()}`);
        setModalOpen(true);
    };

    // Close the modal
    const closeModal = () => {
        setModalOpen(false);
        setSelectedImage(null);
    };
    const [selectedStatuses, setSelectedStatuses] = useState([]);

    // Initialize `selectedStatuses` only if it's empty or if `servicesDataInfo` changes length
    useEffect(() => {
        if (servicesDataInfo && servicesDataInfo.length > 0) {
            // Check if selectedStatuses has been initialized already to avoid resetting
            if (selectedStatuses.length === 0 || selectedStatuses.length !== servicesDataInfo.length) {
                const initialStatuses = servicesDataInfo.map((serviceData) => {
                    // Get status or fallback to an empty string
                    return serviceData?.annexureData?.status || '';
                });
                setSelectedStatuses(initialStatuses);
            }
        }
    }, [servicesDataInfo]); // Only trigger when `servicesDataInfo` changes

    const handleStatusChange = (e, index) => {
        const updatedStatuses = [...selectedStatuses];
        updatedStatuses[index] = e.target.value;
        setSelectedStatuses(updatedStatuses);
    };

    // Check if all statuses are 'completed' (as per your original logic)
    const allCompleted = selectedStatuses.every(status =>
        status && status.includes('completed')
    );

    const handleFileChange = async (index, dbTable, fileName, e) => {
        const selectedFiles = Array.from(e.target.files);

        // Convert files to base64 format for preview
        const base64Promises = selectedFiles.map((file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
        });

        try {
            const base64Files = await Promise.all(base64Promises);

            // Update the state with the new selected files
            setFiles((prevFiles) => ({
                ...prevFiles,
                [dbTable]: { selectedFiles, fileName },
            }));

            // Update the preview state
            setSerpreviewfiles((prevPreviewFiles) => ({
                ...prevPreviewFiles,
                [dbTable]: base64Files,
            }));
        } catch (error) {
            console.error("Error converting files to base64:", error);
        }
    };


    const applicationId = new URLSearchParams(window.location.search).get('applicationId');
    const branchid = new URLSearchParams(window.location.search).get('branchid');
    const ClientId = new URLSearchParams(window.location.search).get('clientId');


    const fromTat = new URLSearchParams(window.location.search).get('from-tat');

    // Set referenceId only once when applicationId changes
    useEffect(() => {
        if (applicationId) setReferenceId(applicationId);
    }, [applicationId]); // Only rerun when applicationId changes

    const fetchServicesJson = useCallback(async (servicesList) => {
        setLoading(true);
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");

        // Return an empty array if servicesList is empty or undefined
        if (!servicesList || servicesList.length === 0) {
            setLoading(false);
            console.warn("Services list is empty.");
            return [];
        }

        try {
            const requestOptions = {
                method: "GET",
                redirect: "follow",
            };

            // Construct the URL with service IDs
            const url = `https://api.screeningstar.co.in/client-master-tracker/services-annexure-data?service_ids=${servicesList}&application_id=${applicationId}&admin_id=${adminId}&_token=${token}`;

            const response = await fetch(url, requestOptions);

            if (response.ok) {
                setLoading(false);
                const result = await response.json();

                // Update the token if a new one is provided
                const newToken = result.token || result._token || "";
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                // Filter out null or invalid items
                const filteredResults = result.results.filter((item) => item != null);
                setServicesDataInfo(filteredResults);
                return filteredResults;
            } else {
                setLoading(false);
                console.error("Failed to fetch service data:", response.statusText);
                return [];
            }
        } catch (error) {
            setLoading(false);
            console.error("Error fetching service data:", error);
            return [];
        }


    },
        []);


    function parseAndConvertDate(inputDate) {
        // Try parsing with the built-in Date constructor
        let parsedDate = new Date(inputDate);

        // If the input date is invalid, attempt to handle common date formats manually
        if (isNaN(parsedDate)) {
            // Handle potential formats manually
            if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(inputDate)) {
                // ISO 8601 format (e.g., "2024-11-19T14:54:38.000Z")
                parsedDate = new Date(inputDate);
            } else if (/\d{4}\/\d{2}\/\d{2}/.test(inputDate)) {
                // "YYYY/MM/DD" format (e.g., "2023/12/11")
                parsedDate = new Date(inputDate.replace(/\//g, '-'));
            } else if (/\d{2}-\d{2}-\d{4}/.test(inputDate)) {
                // "DD-MM-YYYY" format (e.g., "13-11-2024")
                const [day, month, year] = inputDate.split('-');
                parsedDate = new Date(`${year}-${month}-${day}`);
            } else {
                // If it's still not valid, return fallback date
                parsedDate = 'N/A';
            }
        }

        // Format the date to 'YYYY-MM-DD' format
        const formattedDate = parsedDate.toISOString().split('T')[0]; // Extracts only the date portion
        return formattedDate;
    }

    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const fetchApplicationData = useCallback(() => {
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/client-master-tracker/application-by-id?application_id=${applicationId}&branch_id=${branchid}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                const newToken = result.token || result._token || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                const applicationData = result.application;
                const cmtData = result.CMTData || [];
                const services = applicationData.services;
                console.log('result', result);
                fetchServicesJson(services);
                setServicesForm(services);
                setServicesData(result);
                setBranchInfo(result.branchInfo);
                setCustomerInfo(result.customerInfo);
                setApplicationRefID(applicationData.application_id);
                setCmtData(cmtData);

                let newdob = cmtData.dob;
                let newInitiationDate = cmtData.initiation_date;

                // Convert to simple date format (YYYY-MM-DD)


                const formattedDob = formatDate(newdob);
                const formattedInitiationDate = formatDate(newInitiationDate);

                setCmdDates((prevState) => ({
                    ...prevState,
                    dob: formattedDob,
                    initiationDate: formattedInitiationDate,
                }));
                console.log("Formatted DOB:", formattedDob);
                console.log("Formatted Initiation Date:", formattedInitiationDate);

                // It's essential to track the most updated `cmdDates`
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    updated_json: {
                        insuffDetails: {
                            first_insufficiency_marks: cmtData.first_insufficiency_marks || prevFormData.updated_json.insuffDetails.first_insufficiency_marks || '',
                            first_insuff_date: (cmtData.first_insuff_date && !isNaN(new Date(cmtData.first_insuff_date).getTime()))
                                ? new Date(cmtData.first_insuff_date).toISOString().split('T')[0] // Format as YYYY-MM-DD
                                : (prevFormData.updated_json.insuffDetails.first_insuff_date
                                    ? new Date(prevFormData.updated_json.insuffDetails.first_insuff_date).toISOString().split('T')[0]
                                    : null),
                            first_insuff_reopened_date: (cmtData.first_insuff_reopened_date && !isNaN(new Date(cmtData.first_insuff_reopened_date).getTime()))
                                ? parseAndConvertDate(cmtData.first_insuff_reopened_date)
                                : (prevFormData.updated_json.insuffDetails.first_insuff_reopened_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.first_insuff_reopened_date)
                                    : null),

                            second_insufficiency_marks: cmtData.second_insufficiency_marks
                                ? cmtData.second_insufficiency_marks
                                : (prevFormData.updated_json.insuffDetails.second_insufficiency_marks
                                    ? prevFormData.updated_json.insuffDetails.second_insufficiency_marks
                                    : null),

                            second_insuff_date: (cmtData.second_insuff_date && !isNaN(new Date(cmtData.second_insuff_date).getTime()))
                                ? parseAndConvertDate(cmtData.second_insuff_date)
                                : (prevFormData.updated_json.insuffDetails.second_insuff_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.second_insuff_date)
                                    : null),

                            second_insuff_reopened_date: (cmtData.second_insuff_reopened_date && !isNaN(new Date(cmtData.second_insuff_reopened_date).getTime()))
                                ? parseAndConvertDate(cmtData.second_insuff_reopened_date)
                                : (prevFormData.updated_json.insuffDetails.second_insuff_reopened_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.second_insuff_reopened_date)
                                    : null),

                            third_insufficiency_marks: cmtData.third_insufficiency_marks
                                ? cmtData.third_insufficiency_marks
                                : (prevFormData.updated_json.insuffDetails.third_insufficiency_marks
                                    ? prevFormData.updated_json.insuffDetails.third_insufficiency_marks
                                    : null),

                            third_insuff_date: (cmtData.third_insuff_date && !isNaN(new Date(cmtData.third_insuff_date).getTime()))
                                ? parseAndConvertDate(cmtData.third_insuff_date)
                                : (prevFormData.updated_json.insuffDetails.third_insuff_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.third_insuff_date)
                                    : null),

                            third_insuff_reopened_date: (cmtData.third_insuff_reopened_date && !isNaN(new Date(cmtData.third_insuff_reopened_date).getTime()))
                                ? parseAndConvertDate(cmtData.third_insuff_reopened_date)
                                : (prevFormData.updated_json.insuffDetails.third_insuff_reopened_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.third_insuff_reopened_date)
                                    : null),

                            overall_status: cmtData.overall_status ? cmtData.overall_status : prevFormData.updated_json.insuffDetails.overall_status,

                            report_date: (cmtData.report_date && !isNaN(new Date(cmtData.report_date).getTime()))
                                ? parseAndConvertDate(cmtData.report_date)
                                : (prevFormData.updated_json.insuffDetails.report_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.report_date)
                                    : null),

                            report_status: cmtData.report_status ? cmtData.report_status : prevFormData.updated_json.insuffDetails.report_status,

                            report_type: cmtData.report_type ? cmtData.report_type : prevFormData.updated_json.insuffDetails.report_type,

                            final_verification_status: cmtData.final_verification_status ? cmtData.final_verification_status : prevFormData.updated_json.insuffDetails.final_verification_status,

                            is_verify: cmtData.is_verify ? cmtData.is_verify : prevFormData.updated_json.insuffDetails.is_verify,

                            deadline_date: (cmtData.deadline_date && !isNaN(new Date(cmtData.deadline_date).getTime()))
                                ? parseAndConvertDate(cmtData.deadline_date)
                                : (prevFormData.updated_json.insuffDetails.deadline_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.deadline_date)
                                    : null),

                            insuff_address: cmtData.insuff_address ? cmtData.insuff_address : prevFormData.updated_json.insuffDetails.insuff_address,

                            basic_entry: cmtData.basic_entry ? cmtData.basic_entry : prevFormData.updated_json.insuffDetails.basic_entry,

                            education: cmtData.education ? cmtData.education : prevFormData.updated_json.insuffDetails.education,

                            case_upload: cmtData.case_upload ? cmtData.case_upload : prevFormData.updated_json.insuffDetails.case_upload,

                            emp_spoc: cmtData.emp_spoc ? cmtData.emp_spoc : prevFormData.updated_json.insuffDetails.emp_spoc,

                            report_generate_by: cmtData.report_generate_by ? cmtData.report_generate_by : prevFormData.updated_json.insuffDetails.report_generate_by,

                            qc_done_by: cmtData.qc_done_by ? cmtData.qc_done_by : prevFormData.updated_json.insuffDetails.qc_done_by,

                            qc_date: (cmtData.qc_date && !isNaN(new Date(cmtData.qc_date).getTime()))
                                ? parseAndConvertDate(cmtData.qc_date)
                                : (prevFormData.updated_json.insuffDetails.qc_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.qc_date)
                                    : null),

                            delay_reason: cmtData.delay_reason ? cmtData.delay_reason : prevFormData.updated_json.insuffDetails.delay_reason




                            // Repeat for the rest of insuffDetails...
                            // Add additional fields similarly...
                        },
                    }
                }));
                setMyDataQc(myDataQc || applicationData.is_data_qc)
            })
            .catch((error) => {
                setLoading(false);
                console.error('Error fetching application data:', error);
            });
    }, [applicationId, branchid, fetchServicesJson, setServicesForm, setServicesData, setBranchInfo, setCustomerInfo, setFormData, setLoading]);
    const handleChange = (e) => {
        const { name, value, type, options } = e.target;

        if (type === 'select-multiple') {
            // Get selected values from multiple select options
            const selectedValues = Array.from(options)
                .filter(option => option.selected)
                .map(option => option.value);

            setFormData((prevFormData) => {
                const updatedFormData = { ...prevFormData };

                // Check the field's name to determine where to update the formData
                if (name.startsWith('updated_json.address.')) {
                    const addressField = name.replace('updated_json.address.', '');
                    updatedFormData.updated_json.address[addressField] = selectedValues;
                } else if (name.startsWith('updated_json.permanent_address.')) {
                    const permanentField = name.replace('updated_json.permanent_address.', '');
                    updatedFormData.updated_json.permanent_address[permanentField] = selectedValues;
                } else if (name.startsWith('updated_json.insuffDetails.')) {
                    const insuffField = name.replace('updated_json.insuffDetails.', '');
                    updatedFormData.updated_json.insuffDetails[insuffField] = selectedValues;
                } else {
                    const topLevelField = name.replace('updated_json.', '');
                    updatedFormData.updated_json[topLevelField] = selectedValues;
                }

                return updatedFormData;
            });
        } else {
            // For regular fields (non-multiple select)
            setFormData((prevFormData) => {
                const updatedFormData = { ...prevFormData };

                // Handling regular fields (input, radio, etc.)
                if (name.startsWith('updated_json.address.')) {
                    const addressField = name.replace('updated_json.address.', '');
                    updatedFormData.updated_json.address[addressField] = value;
                } else if (name.startsWith('updated_json.permanent_address.')) {
                    const permanentField = name.replace('updated_json.permanent_address.', '');
                    updatedFormData.updated_json.permanent_address[permanentField] = value;
                } else if (name.startsWith('updated_json.insuffDetails.')) {
                    const insuffField = name.replace('updated_json.insuffDetails.', '');
                    updatedFormData.updated_json.insuffDetails[insuffField] = value;
                } else {
                    const topLevelField = name.replace('updated_json.', '');
                    updatedFormData.updated_json[topLevelField] = value;
                }

                return updatedFormData;
            });
        }
    };




    const fetchAdminList = useCallback(() => {
        setLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            setLoading(false);
            console.error("Admin ID or token not found in local storage");
            return;
        }


        // Construct the URL with query parameters
        const url = `https://api.screeningstar.co.in/admin/list?admin_id=${admin_id}&_token=${storedToken}`;

        const requestOptions = {
            method: 'GET',
            redirect: 'follow',
        };

        fetch(url, requestOptions)
            .then((response) => {
                if (!response.ok) {
                    setLoading(false);
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                setLoading(true);
                return response.json(); // Parse response JSON
            })
            .then((data) => {
                const newToken = data.token || data._token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                if (data.status && Array.isArray(data.client_spocs)) {
                    // Map through the `client_spocs` array to get the names
                    const spocsWithIds = data.client_spocs.map((spoc) => ({
                        id: spoc.id,
                        name: spoc.name,
                    }));
                    setAdminNames(spocsWithIds);
                } else {
                    setLoading(false);

                    console.error("Error:", data.message || "Invalid response structure");
                }
            })
            .catch((error) => {
                setLoading(false);

                console.error("Fetch error:", error.message);
            })
            .finally(() => {
                setLoading(true);

            });
    }, []);

    useEffect(() => {
        const initialize = async () => {
            try {
                await fetchApplicationData();

                await fetchAdminList();

            } catch (error) {
                console.error(error.message);
            }
        };

        initialize(); // Execute the sequence
    }, [fetchApplicationData, fetchAdminList]);



    const uploadCustomerLogo = async (email_status) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            console.error("Admin ID or token not found in local storage.");
            return;
        }

        const fileEntries = Object.entries(files);
        const fileCount = fileEntries.length;

        for (const [rawKey, value] of fileEntries) {
            const key = rawKey.replace("[]", ""); // Sanitize key
            const customerLogoFormData = new FormData();

            customerLogoFormData.append("admin_id", admin_id);
            customerLogoFormData.append("_token", storedToken);
            customerLogoFormData.append("application_id", applicationId);
            customerLogoFormData.append("email_status", email_status || 0);
            customerLogoFormData.append("branch_id", branchid);
            customerLogoFormData.append("customer_code", customerInfo.client_unique_id);
            customerLogoFormData.append("application_code", applicationId);

            if (value.selectedFiles?.length > 0) {
                for (const file of value.selectedFiles) {
                    if (file instanceof File) {
                        customerLogoFormData.append("images", file);
                    } else {
                        console.warn("Invalid file object skipped:", file);
                    }
                }

                // Append sanitized file name and table
                const sanitizedFileName = value.fileName.replace(/\[\]$/, "");
                customerLogoFormData.append("db_column", sanitizedFileName);
                customerLogoFormData.append("db_table", key);
            }

            // Append 'send_mail' only in the last iteration
            if (fileEntries.indexOf([rawKey, value]) === fileCount - 1) {
                customerLogoFormData.append("send_mail", 1);
            }

            try {
                const response = await axios.post(
                    "https://api.screeningstar.co.in/client-master-tracker/upload",
                    customerLogoFormData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                const data = response.data; // Axios automatically parses JSON responses
                const newToken = data.token || data._token;

                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
            } catch (err) {
                console.error("Error uploading logo:", err.message || err);
            }
        }
    };
    const handleDataQCChange = (e) => {
        const value = e.target.value;
        setMyDataQc(value);

        // Update errors and clear the specific field's error if it's valid

    };


    const validate = () => {
        const newErrors = {};

        // Validate overall_status
        if (!formData.updated_json.insuffDetails.overall_status) {
            newErrors.overall_status = "Overall Status is required.";
        }

        // Validate first_insuff_reopened_date
        if (!formData.updated_json.insuffDetails.first_insuff_reopened_date) {
            newErrors.first_insuff_reopened_date = "This field is required.";
        }
        // var myDataQc = document.getElementById("myData_qc").value;
        // if (!myDataQc) {
        //     newErrors.myData_qc = "Data QC is required.";
        // }

        if (Array.isArray(servicesDataInfo)) {
            servicesDataInfo.forEach((serviceData, index) => {
                if (serviceData.serviceStatus) {
                    const formJson = JSON.parse(serviceData.reportFormJson.json);
                    const selectedStatus = selectedStatuses[index];

                    // Check if status is selected
                    if (!selectedStatus) {
                        newErrors[`serviceStatus_${index}`] = `Status for ${formJson.heading} is required.`;
                    }
                }
            });
        } else {
            console.error('servicesDataInfo is not an array', servicesDataInfo);
        }


        setErrors(newErrors);
        console.log('errrors', errors)


        if (Object.keys(newErrors).length > 0) {
            const firstErrorField = Object.keys(newErrors)[0];
            inputRefs.current[firstErrorField]?.focus();
        }

        return Object.keys(newErrors).length === 0;
    };

    console.log('data_qc', myDataQc)


    const handleSubmit = useCallback(async (e) => {
        console.log("Submission triggered");
        e.preventDefault();
        const fileEntries = Object.entries(files);
        const fileCount = fileEntries.length;
        if (isNotMandatory || validate()) {
            console.log("Validation passed");
            setLoading(true);
            try {
                const adminData = JSON.parse(localStorage.getItem("admin"));
                const token = localStorage.getItem("_token");
                const validServicesDataInfo = Array.isArray(servicesDataInfo) ? servicesDataInfo : [];

                console.log("Admin Data:", adminData);
                console.log("Token:", token);
                console.log("Services Data Info:", validServicesDataInfo);

                const submissionData = validServicesDataInfo
                    .map((serviceData, index) => {
                        if (serviceData.serviceStatus) {
                            const formJson = serviceData.reportFormJson?.json
                                ? JSON.parse(serviceData.reportFormJson.json)
                                : null;
                            if (!formJson) {
                                console.warn(`Invalid formJson for service at index ${index}`);
                                return null;
                            }

                            const annexure = {};

                            formJson.rows.forEach((row) => {
                                row.inputs.forEach((input) => {
                                    let fieldName = input.name;
                                    const fieldValue =
                                        serviceData.annexureData && serviceData.annexureData.hasOwnProperty(fieldName)
                                            ? serviceData.annexureData[fieldName]
                                            : "";

                                    const tableKey = formJson.db_table;

                                    if (fieldName.endsWith("[]")) {
                                        fieldName = fieldName.slice(0, -2);
                                    }

                                    if (fieldName.startsWith("annexure.")) {
                                        const [, category, key] = fieldName.split(".");
                                        if (!annexure[category]) annexure[category] = {};
                                        annexure[category][key] = fieldValue;
                                    } else {
                                        if (!annexure[tableKey]) annexure[tableKey] = {};
                                        annexure[tableKey][fieldName] = fieldValue;
                                    }
                                });
                            });

                            const category = formJson.db_table;
                            const status = selectedStatuses?.[index] || "";
                            if (annexure[category]) {
                                annexure[category].status = status;
                            }

                            return { annexure };
                        }
                        return null;
                    })
                    .filter((service) => service !== null);

                console.log("Submission Data:", submissionData);

                const rawFilteredSubmissionData = submissionData.filter((item) => item !== null);
                const filteredSubmissionData = rawFilteredSubmissionData.reduce(
                    (acc, item) => ({ ...acc, ...item.annexure }),
                    {}
                );

                Object.keys(filteredSubmissionData).forEach((key) => {
                    const data = filteredSubmissionData[key];
                    Object.keys(data).forEach((subKey) => {
                        if (subKey.startsWith("Annexure")) {
                            delete data[subKey];
                        }
                    });
                });

                console.log("Filtered Submission Data:", filteredSubmissionData);

                const replaceEmptyWithNull = (obj) => {
                    for (let key in obj) {
                        if (obj[key] && typeof obj[key] === "object") {
                            replaceEmptyWithNull(obj[key]);
                        } else {
                            if (obj[key] === "") {
                                obj[key] = null;
                            }
                        }
                    }
                    return obj;
                };

                const modifiedFormData = replaceEmptyWithNull({ ...formData });
                console.log("Modified Form Data:", modifiedFormData);

                const myDataQc = document.getElementById("myData_qc")?.value || null;
                // if (!myDataQc) {
                //     console.error("myData_qc value is missing!");
                //     throw new Error("myData_qc value is required.");
                // }

                const raw = JSON.stringify({
                    admin_id: adminData?.id,
                    _token: token,
                    branch_id: branchid,
                    customer_id: branchInfo.customer_id,
                    application_id: applicationId,
                    data_qc: 1,
                    ...modifiedFormData,
                    annexure: filteredSubmissionData || {},
                    send_mail: Object.keys(files).length === 0 ? 1 : 0,
                });

                console.log("Request Payload:", raw);

                const requestOptions = {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: raw,
                };

                const response = await fetch(
                    `https://api.screeningstar.co.in/client-master-tracker/generate-report`,
                    requestOptions
                );

                console.log("Response Status:", response.status);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                console.log("API Response:", result);

                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                if (fileCount == 0) {
                    Swal.fire("Success!", "Application updated successfully.", "success");
                }

                if (fileCount > 0) {
                    await uploadCustomerLogo(result.email_status);
                    Swal.fire("Success!", "Application updated successfully.", "success");
                }
                const branchidFromUrl = new URLSearchParams(window.location.search).get('branchid');
                const clientIdFromUrl = new URLSearchParams(window.location.search).get('clientId');

                const branchId = branchidFromUrl || cmtData.branch_id;
                const customerId = clientIdFromUrl || cmtData.customer_id;
                if (fromTat == 1) {
                    navigate("/admin-tat-reminder");
                } else {
                    navigate(`/admin-chekin?clientId=${customerId}&branchId=${branchId}`);
                }
            } catch (error) {
                console.error("Error during submission:", error);
                Swal.fire("Error", "Failed to submit the application. Please try again.", "error");
            } finally {
                setLoading(false);
            }
        } else {
            console.log("Validation failed");
        }
    }, [isNotMandatory, validate, servicesDataInfo, branchid, branchInfo, applicationId, formData, selectedStatuses, files, navigate]);

    console.log('servicesDataInfo', servicesDataInfo)
    const handlePreview = useCallback(async (e) => {
        console.log("Preview triggered");
        e.preventDefault();
        const fileEntries = Object.entries(files);
        const fileCount = fileEntries.length;

        if (isNotMandatory || validate()) {
            console.log("Validation passed");

            const adminData = JSON.parse(localStorage.getItem("admin"));
            const token = localStorage.getItem("_token");
            const validServicesDataInfo = Array.isArray(servicesDataInfo) ? servicesDataInfo : [];

            console.log("Admin Data:", adminData);
            console.log("Token:", token);
            console.log("Services Data Info:", validServicesDataInfo);

            const submissionData = validServicesDataInfo
                .map((serviceData, index) => {
                    if (serviceData.serviceStatus) {
                        const formJson = serviceData.reportFormJson?.json
                            ? JSON.parse(serviceData.reportFormJson.json)
                            : null;
                        if (!formJson) {
                            console.warn(`Invalid formJson for service at index ${index}`);
                            return null;
                        }

                        const annexure = {};

                        formJson.rows.forEach((row) => {
                            row.inputs.forEach((input) => {
                                let fieldName = input.name;
                                const fieldValue =
                                    serviceData.annexureData && serviceData.annexureData.hasOwnProperty(fieldName)
                                        ? serviceData.annexureData[fieldName]
                                        : "";

                                const tableKey = formJson.db_table;

                                if (fieldName.endsWith("[]")) {
                                    fieldName = fieldName.slice(0, -2);
                                }

                                if (fieldName.startsWith("annexure.")) {
                                    const [, category, key] = fieldName.split(".");
                                    if (!annexure[category]) annexure[category] = {};
                                    annexure[category][key] = fieldValue;
                                } else {
                                    if (!annexure[tableKey]) annexure[tableKey] = {};
                                    annexure[tableKey][fieldName] = fieldValue;
                                }
                            });
                        });

                        const category = formJson.db_table;
                        const status = selectedStatuses?.[index] || "";
                        if (annexure[category]) {
                            annexure[category].status = status;
                        }

                        return { annexure };
                    }
                    return null;
                })
                .filter((service) => service !== null);



            const rawFilteredSubmissionData = submissionData.filter((item) => item !== null);
            const filteredSubmissionData = rawFilteredSubmissionData.reduce(
                (acc, item) => ({ ...acc, ...item.annexure }),
                {}
            );

            Object.keys(filteredSubmissionData).forEach((key) => {
                const data = filteredSubmissionData[key];
                Object.keys(data).forEach((subKey) => {
                    if (subKey.startsWith("annexurae")) {
                        delete data[subKey];
                    }
                });
            });

            console.log("Filtered Submission Data:", filteredSubmissionData);

            const replaceEmptyWithNull = (obj) => {
                for (let key in obj) {
                    if (obj[key] && typeof obj[key] === "object") {
                        replaceEmptyWithNull(obj[key]);
                    } else {
                        if (obj[key] === "") {
                            obj[key] = null;
                        }
                    }
                }
                return obj;
            };

            const modifiedFormData = replaceEmptyWithNull({ ...formData });
            console.log("Modified Form Data:", modifiedFormData);

            const header = `
                    <div class="preview-section mb-5 p-4 border border-gray-300 rounded-lg bg-white shadow-md">
                        <div class="grid grid-cols-2 gap-3 mb-5">
                             <div class="preview-field" style="margin-bottom: 15px; ">
                                <img  class="headerImage" src="data:image/png;base64,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"  />
                                <div  style="width: 6rem; height: 3rem; padding: 2.75rem; border: 1px solid black;"></div>
                           </div>
                        </div>
                        <div class="w-full h-12 border-b-4 border-black mb-8"></div>
                        <div class="mb-12">
                            <div class="header text-xl font-semibold">BACKGROUND VERIFICATION REPORT</div>
                            <table class="report-container w-full">
                                <tr>
                                    <th>NAME OF ORGANISATION</th>
                                    <td>${cmtData.organization_name || 'N/A'}</td>
                                    <th>NAME OF APPLICANT</th>
                                    <td>${cmtData.applicant_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>SCREENINGSTAR REF ID</th>
                                    <td>${applicationRefID}</td>
                                    <th>DATE OF BIRTH</th>
                                    <td>${cmdDates.dob}</td>
                                </tr>
                                <tr>
                                    <th>EMPLOYEE ID</th>
                                    <td>${cmtData.employee_id || 'N/A'}</td>
                                    <th>INSUFF CLEARED</th>
                                    <td>${formData.updated_json.insuffDetails.first_insuff_reopened_date}</td>
                                </tr>
                                <tr>
                                    <th>VERIFICATION INITIATED</th>
                                    <td>${cmdDates.initiationDate || 'N/A'}</td>
                                    <th>FINAL REPORT DATE</th>
                                    <td>${formData.updated_json.insuffDetails.report_date}</td>
                                </tr>
                                <tr>
                                    <th>VERIFICATION PURPOSE</th>
                                    <td>${cmtData.verification_purpose || 'N/A'}</td>
                                    <th>VERIFICATION STATUS</th>
                                    <td>${formData.updated_json.insuffDetails.final_verification_status}</td>
                                </tr>
                                <tr>
                                    <th>REPORT TYPE</th>
                                    <td>${formData.updated_json.insuffDetails.report_type}</td>
                                    <th>REPORT STATUS</th>
                                    <td>${formData.updated_json.insuffDetails.report_status}</td>
                                </tr>
                            </table>
                        </div>
                       
                     
                `;
            const staticTopOneSection = `
                <div class="mb-8">
                    <div class="header text-xl font-semibold">SUMMARY OF THE VERIFICATION CONDUCTED</div>
                    <table class="report-container w-full">
                        <thead>
                            <tr>
                                <th>SCOPE OF SERVICES / COMPONENT</th>
                                <th>INFORMATION VERIFIED BY</th>
                                <th>VERIFIED DATE</th>
                                <th>VERIFICATION STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(filteredSubmissionData).map(([section, fields]) => {
                const reportFormJson = fields.reportFormJson?.json ? JSON.parse(fields.reportFormJson.json) : {};
                const headers = reportFormJson.headers || [];

                return `
                                    <tr>
                                        <td>${section.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</td>
                                        <td>${fields[`information_source_${section}`] || ''}</td>
                                        <td>${formatDate(fields[`date_of_verification_${section}`] || '')}</td>
                                        <td>${(fields.status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) || '')}</td>
                                    </tr>
                                `;
            }).join('')}
                        </tbody>
                    </table>
                </div>
                 <div style="margin-bottom: 2rem;">
                            <table style="width: 100%; border-collapse: collapse; border: 1px solid black; text-align: center;">
                            <tr><th colspan='5' style="font-size: 1.25rem; font-weight: 600; text-align: center; background-color: #f5f5f5; padding: 8px 0" >COLOR CODE / ADJUDICATION MATRIX</th></tr>
                                <tr style="background-color: #f5f5f5">
                                    <th style="border: 1px solid black; padding: 10px 0">MAJOR DISCREPANCY</th>
                                    <th style="border: 1px solid black;">MINOR DISCREPANCY</th>
                                    <th style="border: 1px solid black;">UNABLE TO VERIFY</th>
                                    <th style="border: 1px solid black;">PENDING FROM SOURCE</th>
                                    <th style="border: 1px solid black;">ALL CLEAR</th>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid black; padding: 20px 40px;"><div style=" background-color: red;padding: 40px;" ></div></td>
                                <td style="border: 1px solid black; padding: 20px 40px;"><div style="background-color: yellow; padding: 40px;"></div></td>  
                                    <td style="border: 1px solid black;padding: 20px 40px;"><div style=" background-color: orange;padding: 40px;" ></div></td>
                                    <td style="border: 1px solid black;padding: 20px 40px;"><div style="background-color: pink;padding: 40px;" ></div></td>
                                    <td style="border: 1px solid black;padding: 20px 40px;"><div style="background-color: green;padding: 40px;" ></div></td>
                                </tr>
                            </table>
                        </div>
            `;
            const previewData = Object.entries(filteredSubmissionData).map(([section, fields]) => {
                // Create a map to store merged rows
                const mergedFields = {};
                const annexures = []; // Store annexures separately
                const mysection = section;
                Object.entries(fields).forEach(([fieldName, fieldValue]) => {
                    // Clean the label
                    const baseFieldName = fieldName.replace(new RegExp(`_${section}$`), ""); // Remove section suffix
                    const formattedLabel = baseFieldName
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, char => char.toUpperCase())
                        .replace(/Verified /i, ""); // Remove "Verified" prefix for unified label

                    // Check if it's a verified field
                    const isVerified = fieldName.startsWith("verified_");

                    // Add to annexures if it's an annexure field
                    if (fieldName.startsWith("annexure_")) {
                        annexures.push(fieldValue || ""); // Annexure field
                    } else {
                        // Add to mergedFields
                        if (!mergedFields[formattedLabel]) {
                            mergedFields[formattedLabel] = { applicantDetails: "", verifiedDetails: "" };
                        }

                        if (isVerified) {
                            mergedFields[formattedLabel].verifiedDetails = fieldValue || "N/A";
                        } else {
                            mergedFields[formattedLabel].applicantDetails = fieldValue || "N/A";
                        }
                    }
                });

                // Generate the table structure
                const tableHtml = `
                                                <table class="preview-table report-container" style="width: 100%; margin-bottom: 20px; border-collapse: collapse; border: 1px solid #ddd; background-color: #fff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                                                        <thead>
                                                    <tr>
                            <th colspan="3" style="text-align: center; font-size: 18px; font-weight: bold; color: #333; padding: 15px; border-bottom: 1px solid #ddd; background-color: #f5f5f5;">
                                ${section.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                            </th>
                            </tr>

                            <tr>
                                <th style="text-align: left; font-size: 18px; font-weight: bold; color: #333; padding: 15px; border-bottom: 1px solid #ddd; ">
                                    PARTICULARS
                                </th>
                                <th style="text-align: left; font-size: 18px; font-weight: bold; color: #333; padding: 15px; border-bottom: 1px solid #ddd; ">
                                    APPLICANT DETAILS
                                </th>
                                <th style="text-align: left; font-size: 18px; font-weight: bold; color: #333; padding: 15px; border-bottom: 1px solid #ddd; ">
                                    VERIFIED DETAILS
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(mergedFields).map(([label, values]) => {
                    return `
                                    <tr>
                                        <td style="padding: 10px; font-weight: 500; color: #4a4a4a; text-transform: capitalize;">
                                            ${label.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                                        </td>
                                        <td style="padding: 10px; background-color: #f8f8f8;">
                                            ${values.applicantDetails.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                                        </td>
                                        <td style="padding: 10px; background-color: #fff;">
                                            ${values.verifiedDetails.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                                        </td>
                                    </tr>
                                `;
                }).join("")}
                        </tbody>
                    </table>
                `;

                const annexureHtml = annexures.length
                    ? `
                  <div class="annexures-section" style="margin-top: 20px; margin-bottom: 50px; ">
                      <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px;">
                          Annexures:
                      </h3>
                      ${Object.entries(fields).map(([fieldName, fieldValue]) => {
                        const previewFiles = serpreviewfiles[mysection] || null;
                        console.log('previewFiles', previewFiles)
                        console.log('mysection', fieldName)
                        return annexures.map(annexure => {
                            if (fieldName.startsWith("annexure")) {
                                const values = previewFiles ? previewFiles : fieldValue.split(",");
                                return values.map(value => `
                                <div style="padding: 10px; border: 2px solid #3d75a6; text-align: center; margin-bottom: 30px;">
                                <img src="${value.trim()}" alt="${fieldName} || 'firebudshfukhdb'" style="max-width: 80%; min-width:50%; border-radius: 5px; object-fit: cover;" />
                                </div>

                             
                            `).join('');
                            }
                            return '';
                        }).join('');
                    }).join('')}
                  </div>
                `
                    : "";

                // Combine table and annexures
                return tableHtml + annexureHtml;



            }).join("");


            const Statictop2Section = `
                 <div class="header">DISCLAIMER</div>
       <div class="contentfooter" style="margin-top: 10px; margin-bottom: 30px; font-weight: 700; font-size: 18px; line-height: 2;">
    This report is confidential and is meant for the exclusive use of the Client. This report has been prepared solely for the
    purpose set out pursuant to our letter of engagement (LoE)/Agreement signed with you and is not to be used for any other
    purpose. The Client recognizes that we are not the source of the data gathered and our reports are based on the
    information provided. The Client is responsible for employment decisions based on the information provided in this
    report. You can mail us at <a href="mailto:compliance@screeningstar.com">compliance@screeningstar.com</a> for any clarifications.
</div>


                 <div class="sspltd" style="text-align: center; font-size: 25px; color: #3d75a6; font-weight: bold;">Screeningstar Solutions Pvt Ltd</div>
                 <div class="address" style="text-align: center;margin-top: 5px; font-size: 20px;  font-weight: light;">No 93/9, Varthur Main Road, Marathahalli, Bangalore, Karnataka</div>
                 <div class="address"  style="text-align: center;margin-top: 5px; font-size: 20px;  font-weight: light;margin-bottom: 50px;">India, Pin Code - 560037</div>
                
                 <div class="header" >END OF DETAIL REPORT</div>



        `;
            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(`
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; color: #333; background-color: #fff; }
                            h1 { text-align: center; color: #333; font-size: 24px; margin-bottom: 20px; }
                            .preview-section { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 15px; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
                            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; }
                            .preview-field { display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center; }
                            .field-label { font-weight: 500; color: #4a4a4a; font-size: 15px; text-transform: capitalize; margin-right: 15px; }
                            .field-value { font-size: 14px; color: #7f8c8d; padding: 5px 10px; border-radius: 5px; background-color: #f8f8f8; width: 60%; word-wrap: break-word; }
                             .field-image { max-width: 150px; max-height: 150px; border-radius: 5px; object-fit: cover; }
                             .headerImage { max-width: 100%; max-height: 5rem; border-radius: 5px; object-fit: cover; }
                            .footer { text-align: center; font-size: 12px; margin-top: 20px; color: #7f8c8d; }
                             .report-container {width: 100%; border-collapse: collapse;  margin: 20px 0;font-size: 16px; text-align: left; }
        .report-container th, .report-container td {
            border: 2px solid #3d75a6;
            padding: 8px;
        }
        .report-container th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
     .header {
    background-color: #f5f5f5; /* Fixed background-color property */
    border: 2px solid #3d75a6; /* Fixed border syntax */
    text-align: center;
    font-size: 20px;
    margin-bottom: 20px;
    font-weight: bold;
    padding-top: 8px;
    padding-bottom: 8px;

}
        .colorcode {
    background-color: #f5f5f5; /* Fixed background-color property */
    border: 2px solid #3d75a6; /* Fixed border syntax */
    text-align: center;
    font-size: 20px;
    font-weight: bold;
}

                        </style>
                    </head>
                    <body>
                        <h1>Form Preview</h1>
                        
                        ${header}
                        ${staticTopOneSection}
                        ${previewData}
                        ${Statictop2Section}
                        <div class="footer">This is a preview of the form data. For any issues, please contact support.</div>
                    </body>
                </html>
            `);
            previewWindow.document.close();
        } else {
            console.log("Validation failed");
        }
    }, [isNotMandatory, validate, servicesDataInfo, branchid, branchInfo, applicationId, formData, selectedStatuses, files]);

    const handleBlur = useCallback((e, inputClass) => {
        const { value } = e.target; // Get the value of the input field
        console.log('Blur Triggered:');
        console.log('Input Value:', value);
        console.log('Input Class:', inputClass);

        // Update all inputs with the same class in your state
        setServicesDataInfo((prev) => {
            const updatedServicesDataInfo = prev.map((item) => ({
                ...item,
                annexureData: {
                    ...item.annexureData,
                    [inputClass]: value || '', // Update all inputs with the same class
                },
            }));

            console.log('After State Update:', updatedServicesDataInfo);

            return updatedServicesDataInfo;
        });
    }, []);
    const handleInputChange = useCallback((e, index, inputclass) => {
        const { value } = e.target; // Get the value of the input field

        console.log('Input Change Triggered:');
        console.log('Input Value:', value);
        console.log('Index:', index);
        console.log('Input Class:', inputclass);

        // Update the specific input in your state based on the class
        setServicesDataInfo((prev) => {
            const updatedServicesDataInfo = prev.map((item) => {
                return {
                    ...item,
                    annexureData: {
                        ...item.annexureData,
                        [inputclass]: value || '', // Update annexureData for the matching inputclass
                    },
                };
            });

            console.log('After State Update:', updatedServicesDataInfo);

            return updatedServicesDataInfo;
        });
    }, []);


    const renderInput = (index, dbTable, input, annexureImagesSplitArr, label, inputColumn) => {
        const isRequired = !isNotMandatory && (input.type === 'file' && annexureImagesSplitArr.length === 0 || (input.type === 'annexure' && annexureImagesSplitArr.length === 0));

        function convertLabelToSnakeCase(label) {
            return label
                .replace(/:/g, '')  // Remove any colons
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .toLowerCase(); // Convert the entire string to lowercase
        }

        const snakeCaseLabel = convertLabelToSnakeCase(label) + `_class` + inputColumn;

        let inputValue = '';
        if (servicesDataInfo[index]?.annexureData?.hasOwnProperty(snakeCaseLabel)) {
            inputValue = servicesDataInfo[index].annexureData[snakeCaseLabel] || '';
        }// Debugging the value for autofill

        switch (input.type) {
            case "text":
            case "email":
            case "tel":
                return (
                    <input
                        type="text"
                        name={input.name}
                        value={inputValue} // Use inputValue from state
                        className={`w-full p-2 border border-gray-300 ${snakeCaseLabel} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        onChange={(e) => handleInputChange(e, index, snakeCaseLabel)} // Pass the snakeCaseLabel for state update
                        onBlur={(e) => handleBlur(e, snakeCaseLabel)}
                    />
                );
            case "datepicker":
                return (
                    <input
                        type="date"
                        name={input.name}
                        value={inputValue} // Use inputValue from state
                        className="w-full p-2 border border-gray-300 rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => handleInputChange(e, index, snakeCaseLabel)} // Pass the snakeCaseLabel for state update
                        onBlur={(e) => handleBlur(e, snakeCaseLabel)}
                    />
                );
            case "dropdown":
                return (
                    <select
                        name={input.name}
                        value={inputValue} // Use inputValue from state
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => handleInputChange(e, index, snakeCaseLabel)} // Pass the snakeCaseLabel for state update
                        onBlur={(e) => handleBlur(e, snakeCaseLabel)}
                    >
                        {input.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.showText}
                            </option>
                        ))}
                    </select>
                );
            case "file":
                return (
                    <>
                        <input
                            type="file"
                            name={input.name}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            multiple={input.multiple}
                            required={isRequired}
                            onChange={(e) => handleFileChange(index, dbTable, input.name, e)}
                        />
                        {annexureImagesSplitArr.length > 0 && (
                            <Swiper
                                onSwiper={setThumbsSwiper}
                                spaceBetween={10}
                                slidesPerView={4}
                                freeMode
                                watchSlidesProgress
                                modules={[Thumbs]}
                                className="thumbsSwiper"
                            >
                                {annexureImagesSplitArr.map((image, index) => (
                                    <SwiperSlide key={index}>
                                        <img
                                            src={`${image.trim()}`}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="cursor-pointer"
                                            onClick={() => openModal(image)} // Open modal on click
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        )}
                    </>
                );
            default:
                return (
                    <input
                        type="text"
                        name={input.name}
                        value={inputValue} // Use inputValue from state
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => handleInputChange(e, index, snakeCaseLabel)} // Pass the snakeCaseLabel for state update
                        onBlur={(e) => handleBlur(e, snakeCaseLabel)}
                    />
                );
        }
    };



    const handleGoBack = () => {
        const branchidFromUrl = new URLSearchParams(window.location.search).get('branchid');
        const clientIdFromUrl = new URLSearchParams(window.location.search).get('clientId');

        const branchId = branchidFromUrl || cmtData.branch_id;
        const customerId = clientIdFromUrl || cmtData.customer_id;

        if (fromTat == 1) {
            navigate("/admin-tat-reminder");
        } else {
            navigate(`/admin-chekin?clientId=${customerId}&branchId=${branchId}`);
        }
    }

    const optionsData = [
        {
            label: "ADDRESS",
            options: [
                {
                    value: "applicant_declined_no_explanation",
                    text: "The applicant declined the address verification process and did not provide an explanation.",
                },
                { value: "untraceable_address", text: "The address provided was untraceable and could not be located despite visiting the candidate's specified location." },
                { value: "contact_not_responding", text: "Unable to complete the address verification as the candidate is not answering calls, the phone is switched off, incoming calls are barred, or the number is no longer in use. Kindly provide an alternate contact number to proceed." },
                { value: "mobile_number_switched_off", text: "The candidate's mobile number is switched off. Kindly provide an alternate contact number for address verification." },
                { value: "no_response_at_address", text: "Upon reaching the candidate's address, there was no response to the calls made. As a result, the verification check is being closed as 'Unable to Verify'." },
                { value: "address_verified_successfully", text: "Address verification has been successfully completed within the TAT." },
                { value: "candidate_shifted_new_address", text: "The candidate has shifted to a new address. Kindly provide the updated address to re-initiate the verification process." },
                { value: "candidate_declined_address_verification", text: "The candidate has declined the offer and has expressed no interest in completing the address verification process." },
                { value: "candidate_left_job_not_interested", text: "The candidate has left the job and is not interested in utilizing the verification services." },
                { value: "address_verified_within_tat", text: "The address verification has been successfully completed within the turnaround time (TAT)." },
                { value: "digital_address_verification_pending", text: "The digital address verification link has been sent to the candidate and is pending completion from their side." },
                { value: "unable_to_verify_location", text: "We do not serve the candidate's location, making the verification unfeasible. Kindly confirm if you'd like to proceed with the DAV (Digital Address Verification) instead." },
                { value: "candidate_denied_verification", text: "The candidate has denied the verification." },
            ],
        },
        {
            label: "EDUCATION",
            options: [
                { value: "incomplete_documents", text: "The submitted documents are incomplete for verification. Please provide the Convocation Certificate along with all semester mark sheets." },
                { value: "university_not_recognized", text: "The 12th Standard - University/Board is not recognized as genuine, making the verification process Not doable." },
                { value: "uncut_documents_rejected", text: "The documents received for the 12th Standard are unclear or uncut copies, leading to rejection by the university/board. Kindly provide clear copies of the documents to proceed." },
                { value: "board_not_recognized", text: "The 10th Standard - The state or central board is not recognized as genuine, making the verification process Not doable." },
                { value: "uncut_documents_10th_rejected", text: "The documents received for the 10th Standard are unclear or uncut copies, leading to rejection by the university/board. Kindly provide clear copies of the documents to proceed." },
                { value: "unclear_diploma_documents", text: "The diploma documents received are unclear. Kindly provide clear or uncut copies to proceed." },
                { value: "unclear_graduation_documents", text: "The graduation documents received are unclear or uncut copies, resulting in rejection by the university. Kindly provide clear copies of the documents to proceed." },
                { value: "unclear_post_graduation_documents", text: "The post-graduation documents received are unclear or uncut copies, leading to rejection by the university. Kindly provide clear copies of the documents to proceed." },
                { value: "unrecognized_graduation_university", text: "Graduation - The university is not recognized, suspected to be non-genuine, or not approved by UGC, making the verification process Not doable." },
                { value: "delay_in_education_insufficiency", text: "There is a delay in addressing the educational insufficiency by the client." },
                { value: "unavailable_spoc_at_university", text: "The concerned SPOC was unavailable at the university for verifying the education check, causing a delay in the process." },
                { value: "unclear_documents_rejected", text: "The documents shared via email/folder are unclear and have been rejected by the university/school. Kindly provide clear copies of the same to proceed with the verification." },
                { value: "delay_in_ex_employment_insufficiency", text: "There is a delay in addressing the ex-employment insufficiency by the client." }
            ],
        },
        {
            label: "EMPLOYMENT",
            options: [
                { value: "employer_not_responding", text: "Ex-Employment: The employer is responding to calls but has not been replying to emails." },
                { value: "candidate_absconded_employer_denied", text: "The candidate has absconded, and the employer has refused to provide verification." },
                { value: "no_official_email_for_verification", text: "According to the employer, they do not have an official email ID for verification and can only provide a verbal confirmation or respond via a Gmail ID, if necessary." },
                { value: "centralized_verification_no_calls", text: "Latest Employment-1: The verification process is centralized, with no option for calls, despite multiple reminders. There is no commitment to a specific turnaround time (TAT)." },
                { value: "centralized_ex_employment_no_calls", text: "Ex-Employment-2: The verification process is centralized, with no option for calls, despite multiple reminders. There is no commitment to a specific turnaround time (TAT)." },
                { value: "centralized_previous_employment_no_calls", text: "Previous Employment-3: The verification process is centralized, with no option for calls, despite multiple reminders. There is no commitment to a specific turnaround time (TAT)." },
                { value: "centralized_previous_employment_no_calls_4", text: "Previous Employment-4: The verification process is centralized, with no option for calls, despite multiple reminders. There is no commitment to a specific turnaround time (TAT)." },
                { value: "centralized_previous_employment_no_calls_5", text: "Previous Employment-5: The verification process is centralized, with no option for calls, despite multiple reminders. There is no commitment to a specific turnaround time (TAT)." },
                { value: "spoc_unavailable_due_to_leave", text: "The concerned SPOC is unavailable due to personal leave and has requested additional time to respond to the email." },
                { value: "exit_formalities_not_completed", text: "Latest Employment-1: The candidate has not completed the exit formalities, and as a result, the employer has denied the verification." },
                { value: "ex_employment_pending_verification", text: "Ex-Employment-2: The candidate has not completed the exit formalities, leading the employer to deny the verification." },
                { value: "previous_employment_pending_verification", text: "Previous Employment-3: The candidate has not completed the exit formalities, resulting in the employer denying the verification." },
                { value: "previous_employment_pending_verification_4", text: "Previous Employment-4: The candidate has not completed the exit formalities, resulting in the employer denying the verification." },
                { value: "previous_employment_pending_verification_5", text: "Previous Employment-5: The candidate has not completed the exit formalities, resulting in the employer denying the verification." },
                { value: "active_employee_verification_pending", text: "Active Employment: The candidate is still an active employee in the organization. The employer has requested that the verification be initiated once the candidate has been relieved." },
                { value: "verification_complete_ex_employment_pending", text: "All verification services have been completed, and only the Ex-Employment verification is pending. Kindly advise on the next steps for closure." },
                { value: "employer_not_responding_email", text: "The ex-employer is not responding to the emails. Kindly confirm if we should proceed with UAN (Universal Account Number) as an alternate option to close the employment verification." },
                { value: "employer_not_responding_auditing", text: "After multiple attempts, the employer has not responded. Therefore, the verification is being closed as it cannot be verified due to auditing reasons." },
                { value: "ex_employer_details_not_found", text: "The ex-employer details could not be found. Kindly provide the correct point of contact details to proceed with the employment check." },
                { value: "ex_employer_no_longer_exists", text: "The ex-employer no longer exists and has been closed (shut down)." },
                { value: "uan_required_for_verification", text: "The UAN number is mandatory for the verification process. Kindly provide the UAN number to proceed with the verification." },
                { value: "spoc_not_responding_employer_denied", text: "The concerned HR/Manager/team have not responded to the ex-employment verification despite multiple attempts through emails and calls. They are also avoiding the calls." },
                { value: "ex_employment_site_visit", text: "The ex-employment verification has been initiated for a physical site visit." },
                { value: "digital_ex_employment_pending", text: "The digital ex-employment verification has been initiated and is currently pending completion from the candidate." },
                { value: "ex_employment_negative_remarks", text: "The ex-employment remarks are negative. Kindly advise on how to proceed further." }
            ]
        }
        ,
        {
            label: "GLOBAL WORLD CHECK",
            options: [
                { value: "provide_candidate_details", text: "Kindly provide the following complete details of the candidate for the global database: Name of the Candidate, Father Name, DOB, Marital Status, Gender & Full Address." },
            ],
        },
        {
            label: "DRUG TEST",
            options: [
                { value: "drug_test_initiated_kit_in_transit", text: "The drug test has been initiated, and the kit is currently in transit. The delay was due to the unavailability of the courier service." },
                { value: "candidate_not_available_for_drug_test", text: "The candidate was not available at the address to complete the drug test." },
                { value: "candidate_not_cooperating_drug_test", text: "The candidate is not cooperating with the drug test, and it remains pending." }
            ],
        },
        {
            label: "PROFESSIONAL REFERENCE",
            options: [
                { value: "professional_reference_denied", text: "Professional Reference: The concerned person has denied the verification." },
                { value: "incorrect_contact_details", text: "Professional Reference: The contact details provided are incorrect. Kindly provide an alternate point of contact number." }
            ],
        },
        {
            label: "COURT VERIFICATION",
            options: [
                {
                    value: "provide_details_for_court_verification",
                    text: "To proceed with the court verification, we require the complete details of the candidate, including their full name, father's name, date of birth (DOB), marital status, gender, and complete address (including state and pincode). Kindly share these requested details to initiate the verification process."
                }
            ],
        },
        {
            label: "POLICE VERIFICATION",
            options: [
                {
                    value: "provide_details_for_police_verification",
                    text: "To proceed with the police verification, we require the complete details of the candidate, including their full name, father's name, date of birth (DOB), marital status, gender, and full address (including state and pincode). Kindly share these requested details to initiate the verification process."
                }
            ],
        },
        {
            label: "CIBIL VERIFICATION",
            options: [
                {
                    value: "cibil_verification",
                    text: "For the CIBIL verification, we require the complete details of the candidate, including their full name, father's name, date of birth (DOB), full address (including state and pincode). Kindly share these requested details to proceed with the verification."
                }
            ],
        },
        {
            label: "PAN CARD",
            options: [
                {
                    value: "pan_card",
                    text: "The PAN number is mandatory for the Form 26 AS verification. Kindly provide the PAN number to proceed with the verification."
                }
            ],
        },
        {
            label: "BANK STATEMENT VERIFICATION",
            options: [
                {
                    value: "missing_bank_statement",
                    text: "Kindly provide the bank statement for the verification process."
                }
            ],
        },
        {
            label: "NATIONAL IDENTITY CHECK",
            options: [
                {
                    value: "missing_identity_document",
                    text: "Kindly provide one of the following documents for the national identity check: Aadhaar, PAN card, Passport, Driving License (DL), or Voter ID."
                }
            ],
        }
        ,
        {
            label: "OTHER REMARKS",
            options: [
                {
                    value: "insufficiency_not_cleared_by_hr",
                    text: "Insufficiency was not cleared by the HR Team within the TAT, so closing the check with unable to verify."
                },
                {
                    value: "nil",
                    text: "NIL"
                },
                {
                    value: "manual_update_required",
                    text: "Other - Give option to enter manually to update post fill the new comment which is not added in the following list of remarks."
                },
                {
                    value: "not_applicable",
                    text: "Not Applicable"
                },
                {
                    value: "candidate_unaware_of_bgv_process",
                    text: "The candidate is unaware of the background verification process and will follow up after consulting with the HR team."
                },
                {
                    value: "bgv_form_not_submitted",
                    text: "The online background verification (BGV) form was shared with the candidate but has not yet been filled out and submitted by them."
                },
                {
                    value: "client_requested_to_hold_verification",
                    text: "Client requested to hold the verification."
                },
                {
                    value: "interim_report_shared_tat_exceeded",
                    text: "An interim report was shared as the TAT was exceeded, and the insufficiency was not resolved."
                },
                {
                    value: "interim_report_shared_final_report_pending",
                    text: "Interim report shared and yet to share the Final report."
                },
                {
                    value: "verification_completed_final_report_pending",
                    text: "Verification has been completed, and the final report is yet to be generated."
                },
                {
                    value: "unable_to_verify_due_to_insufficiency",
                    text: "The insufficiency was not resolved by the HR team within the TAT, so the check is being closed as 'unable to verify'."
                },
                {
                    value: "closure_advice_pending_from_hr",
                    text: "Closure advice was pending from the HR team; hence, the case is being closed with a valid reason as per the adjudication matrix."
                },
                {
                    value: "closure_advice_pending_from_hr_team",
                    text: "Closure Advice is pending from HR Team."
                },
                {
                    value: "pricing_approval_pending",
                    text: "Pricing Approval is pending."
                },
                {
                    value: "pricing_approval_for_abroad_employment",
                    text: "Pricing approval for abroad employment, amounting to $25, is pending."
                },
                {
                    value: "abroad_services_not_doable",
                    text: "Abroad Services are not doable."
                },
                {
                    value: "server_issues_generating_final_report",
                    text: "Facing the server issues to generate the Final report."
                },
                {
                    value: "abroad_services_tat_30_business_days",
                    text: "Abroad Services TAT will be 30 Business Days."
                },
                {
                    value: "documents_do_not_align_with_email_or_excel",
                    text: "The received documents do not align with the details provided in the email, Excel file, or Bulk folder."
                },
                {
                    value: "candidate_cv_and_documents_required",
                    text: "Please provide the candidate's CV along with all supporting documents, such as educational qualifications, experience certificates, and any other relevant documents, for CV validation and gap verification."
                }
            ],
        },



    ];

    return (
        <div className="bg-[#c1dff2] border border-black">
            <h2 className="text-2xl font-bold py-3 text-left text-[#4d606b] px-3 border">GENERATE REPORT</h2>
            <div className='bg-white p-4 w-full border-t border-black mx-auto'>
                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <div className=" p-12">

                    {loading ? (
                        <div className="flex w-full justify-center items-center h-20">
                            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                        </div>
                    ) : (
                        <form className="space-y-4" autoComplete="off" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="apid" className="block text-gray-700">Reference ID</label>
                                <input
                                    type="text"
                                    name="application_id"
                                    id="apidoo"
                                    value={applicationRefID}
                                    readOnly
                                    className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                />
                                <input type="hidden" name="apid" id="apid" value={referenceId} />
                            </div>
                            <div className=" form start space-y-4 py-[30px]  bg-white rounded-md" id="client-spoc">
                                <div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="month_year">Month - Year<span className="text-red-500 text-xl" >*</span></label>
                                            <input
                                                type="text"
                                                name="month_year"
                                                id="month_year"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.month_year}
                                                // onChange={handleChange}
                                                readOnly
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="initiation_date">Initiation Date</label>
                                            <input
                                                type="date"
                                                name="initiation_date"
                                                id="initiation_date"
                                                className="w-full border p-2 outline-none rounded-md mt-2"
                                                value={cmdDates.initiationDate}
                                                // onChange={handleChange}
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="organization_name">Name of the Client Organization</label>
                                            <input
                                                type="text"
                                                name="organization_name"
                                                id="organization_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.organization_name}
                                                // onChange={handleChange}
                                                readOnly
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="verification_purpose">Verification Purpose<span className="text-red-500 text-xl" >*</span></label>
                                            <input
                                                type="text"
                                                name="verification_purpose"
                                                id="verification_purpose"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.verification_purpose}
                                                readOnly
                                            // onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="employee_id">Applicant Employee ID</label>
                                            <input
                                                type="text"
                                                name="employee_id"
                                                id="employee_id"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.employee_id}
                                                // onChange={handleChange}
                                                readOnly
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="client_code">Client Code</label>
                                            <input
                                                type="text"
                                                name="client_code"
                                                id="client_code"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.client_code}
                                                readOnly
                                            // onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="applicant_name">Name of the Applicant<span className="text-red-500 text-xl" >*</span></label>
                                            <input
                                                ref={(el) => (inputRefs.current['applicant_name'] = el)} // Add ref
                                                type="text"
                                                name="applicant_name"
                                                id="applicant_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.applicant_name}
                                                readOnly
                                            // onChange={handleChange}
                                            />
                                            {errors.applicant_name && (
                                                <p className="text-red-500 text-sm">{errors.applicant_name}</p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="contact_number">Contact Number</label>
                                            <input
                                                type="tel"
                                                name="contact_number"
                                                id="contact_number"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.contact_number}
                                                readOnly
                                            // onChange={handleChange}
                                            />
                                            {errors.contact_number && (
                                                <p className="text-red-500 text-sm">{errors.contact_number}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="contact_number2">Contact Number 2:</label>
                                            <input
                                                type="tel"
                                                name="contact_number2"
                                                id="contact_number2"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.contact_number2}
                                                readOnly
                                            // onChange={handleChange}
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="father_name">Father's Name:</label>
                                            <input
                                                type="text"
                                                name="father_name"
                                                id="father_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.father_name}
                                                readOnly
                                            // onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="gender">Gender</label>
                                            <select
                                                name="gender"
                                                id="gender"
                                                className="border w-full rounded-md p-2 mt-2"
                                                value={cmtData.gender}
                                                readOnly
                                            // onChange={handleChange}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                            {errors.gender && (
                                                <p className="text-red-500 text-sm">{errors.gender}</p>
                                            )}
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="dob">Date Of Birth</label>
                                            <input
                                                type="date"
                                                name="dob"
                                                id="dob"
                                                className="w-full border p-2 outline-none rounded-md mt-2"
                                                value={cmdDates.dob}
                                                // onChange={handleChange}
                                                readOnly
                                            />
                                            {errors.dob && (
                                                <p className="text-red-500 text-sm">{errors.dob}</p>
                                            )}
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="marital_status">Marital Status</label>
                                            <select
                                                name="marital_status"
                                                id="marital_status"
                                                className="border w-full rounded-md p-2 mt-2"
                                                value={cmtData.marital_status}
                                                readOnly
                                            // onChange={handleChange}
                                            >
                                                <option value="">Select Marital Status</option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                            </select>
                                        </div>
                                    </div>


                                </div>

                                <div className='permanentaddress '>
                                    <div className='my-4 font-semibold text-xl '>Permanent Address</div>
                                    <div className="form-group border border-black p-3 rounded-md">
                                        <div className="mb-4">
                                            <label htmlFor="full_address">Full Address:</label>
                                            <div
                                                id="full_address"
                                                className="border w-full rounded-md p-2 mt-2 capitalize overflow-x-auto whitespace-nowrap"
                                            >
                                                {`
    ${cmtData.permanent_address_house_no || ''}
    ${cmtData.permanent_address_floor || ''}
    ${cmtData.permanent_address_cross || ''}
    ${cmtData.permanent_address_street || ''}
    ${cmtData.permanent_address_main || ''}
    ${cmtData.permanent_address_area || ''}
    ${cmtData.permanent_address_locality || ''}
    ${cmtData.permanent_address_city || ''}
    ${cmtData.permanent_address_landmark || ''}
    ${cmtData.permanent_address_taluk || ''}
    ${cmtData.permanent_address_district || ''}
    ${cmtData.permanent_address_state || ''}
    ${cmtData.permanent_address_pin_code || ''}
  `.replace(/\s+/g, ' ').trim()}
                                            </div>


                                        </div>

                                        <div className="form-group">
                                            <h3 className="font-medium text-lg mb-3">Period of Stay</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="mb-4">
                                                    <label htmlFor="permanent_sender_name">From:</label>
                                                    <input
                                                        type="text"
                                                        name="updated_json.permanent_address.permanent_sender_name"
                                                        id="permanent_sender_name"
                                                        className="border w-full rounded-md p-2 mt-2 capitalize"
                                                        value={cmtData.permanent_sender_name}
                                                        // onChange={handleChange}
                                                        readOnly
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label htmlFor="permanent_receiver_name">To:</label>
                                                    <input
                                                        type="text"
                                                        name="updated_json.permanent_address.permanent_receiver_name"
                                                        id="permanent_receiver_name"
                                                        className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                        value={cmtData.permanent_receiver_name}
                                                        // onChange={handleChange}
                                                        readOnly
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="mb-4">
                                                    <label htmlFor="permanent_landmark">Landmark:</label>
                                                    <input
                                                        type="text"
                                                        name="updated_json.permanent_address.permanent_landmark"
                                                        id="permanent_landmark"
                                                        className="border w-full rounded-md p-2 mt-2 capitalize"
                                                        value={cmtData.permanent_address_landmark}
                                                        // onChange={handleChange}
                                                        readOnly
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label htmlFor="permanent_pin_code">Pin Code:</label>
                                                    <input
                                                        type="text" // Keep as text to handle leading zeros
                                                        name="updated_json.permanent_address.permanent_pin_code"
                                                        id="permanent_pin_code"
                                                        className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                        value={cmtData.permanent_address_pin_code}
                                                        readOnly
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="permanent_state">State:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.permanent_address.permanent_state"
                                                    id="permanent_state"
                                                    className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                    value={cmtData.permanent_address_state}
                                                    // onChange={handleChange}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='currentaddress '>
                                    <div className='my-4 font-semibold text-xl'>Current Address </div>
                                    <div className="form-group border border-black rounded-md p-3">
                                        <div className="mb-4">
                                            <label htmlFor="full_address">Full Address:</label>
                                            <div
                                                id="full_address"
                                                className="border w-full rounded-md p-2 mt-2 capitalize overflow-x-auto whitespace-nowrap"
                                            >
                                                {`
    ${cmtData.address_house_no || ''}
    ${cmtData.address_floor || ''}
    ${cmtData.address_cross || ''}
    ${cmtData.address_street || ''}
    ${cmtData.address_main || ''}
    ${cmtData.address_area || ''}
    ${cmtData.address_locality || ''}
    ${cmtData.address_city || ''}
    ${cmtData.address_landmark || ''}
    ${cmtData.address_taluk || ''}
    ${cmtData.address_district || ''}
    ${cmtData.address_state || ''}
    ${cmtData.address_pin_code || ''}
  `.replace(/\s+/g, ' ').trim()}
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="Landmark">Landmark:</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.landmark"
                                                id="landmark"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.address_landmark}
                                                // onChange={handleChange}
                                                readOnly
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="residence_mobile_number">Residence Mobile No:</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.residence_mobile_number"
                                                id="residence_mobile_number"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={cmtData.residence_mobile_number}
                                                // onChange={handleChange}
                                                readOnly
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="state">State</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.state"
                                                id="state"
                                                className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                value={cmtData.address_state}
                                                // onChange={handleChange}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="SelectedServices  border border-black rounded-md ">
                                    <div className='bg-[#c1dff2] border-b border-black  rounded-t-md p-4'>
                                        <h1 className="text-center text-2xl">SELECTED SERVICES<span className="text-red-500 text-xl" >*</span></h1>
                                    </div>
                                    <div className='p-5 border '>
                                        {servicesDataInfo && servicesDataInfo.map((serviceData, index) => {
                                            if (serviceData.serviceStatus) {
                                                const formJson = JSON.parse(serviceData.reportFormJson.json);
                                                const dbTableHeading = formJson.heading;
                                                const dbTable = formJson.db_table;
                                                let status = serviceData?.annexureData?.status || '';
                                                let preselectedStatus = selectedStatuses[index] || status;

                                                return (
                                                    <div key={index} className="mb-6 flex justify-between mt-5">
                                                        {formJson.heading && (
                                                            <>
                                                                <span>{formJson.heading}</span>
                                                                <select
                                                                    className="border p-2 w-7/12 rounded-md"
                                                                    value={preselectedStatus}
                                                                    onChange={(e) => handleStatusChange(e, index)}
                                                                >
                                                                    <option value="">--Select status--</option>
                                                                    <option value="nil">NIL</option>
                                                                    <option value="initiated">INITIATED</option>
                                                                    <option value="hold">HOLD</option>
                                                                    <option value="closure_advice">CLOSURE ADVICE</option>
                                                                    <option value="wip">WIP</option>
                                                                    <option value="insuff">INSUFF</option>
                                                                    <option value="completed">COMPLETED</option>
                                                                    <option value="completed_green">COMPLETED GREEN</option>
                                                                    <option value="completed_orange">COMPLETED ORANGE</option>
                                                                    <option value="completed_red">COMPLETED RED</option>
                                                                    <option value="completed_yellow">COMPLETED YELLOW</option>
                                                                    <option value="completed_pink">COMPLETED PINK</option>
                                                                    <option value="stopcheck">STOPCHECK</option>
                                                                    <option value="active_employment">ACTIVE EMPLOYMENT</option>
                                                                    <option value="not_doable">NOT DOABLE</option>
                                                                    <option value="candidate_denied">CANDIDATE DENIED</option>
                                                                </select>
                                                                {errors[`serviceStatus_${index}`] && (
                                                                    <span className="text-red-500 text-sm">{errors[`serviceStatus_${index}`]}</span>
                                                                )}
                                                            </>

                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>

                                <div className="container mx-auto mt-5 py-2">
                                    {servicesDataInfo && servicesDataInfo.map((serviceData, index) => {
                                        if (serviceData.serviceStatus) {
                                            const formJson = JSON.parse(serviceData.reportFormJson.json);
                                            const dbTableHeading = formJson.heading;
                                            const dbTable = formJson.db_table;
                                            let annexureData = serviceData?.annexureData || {};
                                            let annexureImagesSplitArr = [];

                                            if (annexureData) {
                                                const annexureImagesKey = Object.keys(annexureData).find(key =>
                                                    key.toLowerCase().startsWith('annexure') &&
                                                    !key.includes('[') &&
                                                    !key.includes(']')
                                                );
                                                if (annexureImagesKey) {
                                                    const annexureImagesStr = annexureData[annexureImagesKey];
                                                    annexureImagesSplitArr = annexureImagesStr ? annexureImagesStr.split(',') : [];
                                                }
                                            }

                                            return (
                                                <div key={index} className="mb-6">
                                                    {/* Only render form if the selected status is not "nil" */}
                                                    {selectedStatuses[index] !== "nil" && (
                                                        <>
                                                            <div className='border mt-12 rounded-t-md'>
                                                                {dbTableHeading && (
                                                                    <div className='bg-[#c1dff2] border border-black rounded-t-md p-4'>
                                                                        <h3 className="text-center text-2xl font-semibold ">{dbTableHeading}</h3>
                                                                    </div>
                                                                )}
                                                                <div className='border-[#c1dff2] border border-t-0 rounded-md'>
                                                                    <table className="w-full table-auto">
                                                                        <thead>
                                                                            <tr className="bg-gray-100">
                                                                                {formJson.headers.map((header, idx) => (
                                                                                    <th key={idx} className="py-2 px-4 border border-gray-300 text-left">{header}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {formJson.rows.map((row, idx) => (
                                                                                <tr key={idx} className="odd:bg-gray-50">
                                                                                    <td className="py-2 px-4 border {row.label} border-gray-300"
                                                                                        ref={(el) => (inputRefs.current['annexure'] = el)}
                                                                                    >{row.label}</td>

                                                                                    {row.inputs.length === 1 ? (
                                                                                        <td colSpan={formJson.headers.length - 1} className="py-2 px-4 border border-gray-300">
                                                                                            {renderInput(index, dbTable, row.inputs[0], annexureImagesSplitArr, row.label, 1)}
                                                                                        </td>
                                                                                    ) : (
                                                                                        row.inputs.map((input, i) => (
                                                                                            <td key={i} className="py-2 px-4 border border-gray-300">
                                                                                                {renderInput(index, dbTable, input, annexureImagesSplitArr, row.label, i)}
                                                                                            </td>
                                                                                        ))
                                                                                    )}
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                    {errors[`annexure_${index}`] && (
                                                                        <p className="text-red-500 text-sm">{errors[`annexure_${index}`]}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}

                                </div>



                                {/* Modal to show the selected image */}
                                {modalOpen && (
                                    <div
                                        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
                                        onClick={closeModal} // Close modal when clicked outside
                                    >
                                        <div
                                            className="relative max-w-full max-h-full p-4"
                                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
                                        >
                                            <img
                                                src={selectedImage}
                                                alt="Selected"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                            <button
                                                className="absolute top-2 right-2 bg-white text-black p-2 rounded-full shadow-md hover:bg-gray-300"
                                                onClick={closeModal} // Close the modal on click
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group border rounded-md p-3">
                                {/* <div className="gap-3">
                                    <div className="mb-4">
                                        <label htmlFor="myData_qc">Data QC</label><span className="text-red-500 text-xl">*</span>
                                        <select
                                            ref={(el) => (inputRefs.current["myData_qc"] = el)}
                                            name="myData_qc"
                                            id="myData_qc"
                                            className={`border w-full rounded-md p-2 mt-2 ${errors.myData_qc ? "border-red-500" : ""}`}
                                            onChange={handleDataQCChange}
                                            value={myDataQc}
                                            aria-label="Select QC Status"
                                        >
                                            <option value="">Select QC</option>
                                            <option value="1">YES</option>
                                            <option value="0">NO</option>
                                        </select>

                                        {errors.myData_qc && (
                                            <p className="text-red-500 text-sm">{errors.myData_qc}</p>
                                        )}
                                    </div>
                                </div> */}

                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="first_insufficiency_marks">First Level Insufficiency Remarks</label>
                                    <select
                                        multiple
                                        id="first_insufficiency_marks"
                                        name="updated_json.insuffDetails.first_insufficiency_marks"
                                        value={formData.updated_json.insuffDetails.first_insufficiency_marks}
                                        onChange={handleChange}
                                        className="border border-gray-300 rounded-md p-2 mt-2 w-full focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 hover:h-42 focus:h-42 transition-all duration-300 ease-in-out capitalize text-gray-700 h-40"
                                    >
                                        {optionsData.map((group) => (
                                            <optgroup key={group.label} label={group.label} className="text-sm font-bold text-gray-700">
                                                {group.options.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                        className="hover:bg-gray-200 focus:bg-blue-100 transition-all duration-300 ease-in-out p-2"
                                                    >
                                                        {option.text}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>



                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="first_insuff_date">First Insuff Raised Date:</label>
                                    <input
                                        type="date"
                                        name="updated_json.insuffDetails.first_insuff_date"
                                        id="first_insuff_date"
                                        className="border w-full rounded-md p-2 mt-2 "
                                        value={formData.updated_json.insuffDetails.first_insuff_date}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="first_insuff_reopened_date">First Insuff Cleared Date / Re-Opened date<span className="text-red-500 text-xl" >*</span></label>
                                    <input
                                        ref={(el) => (inputRefs.current['first_insuff_reopened_date'] = el)} // Add ref
                                        type="date"
                                        name="updated_json.insuffDetails.first_insuff_reopened_date"
                                        id="first_insuff_reopened_date"
                                        className="border w-full rounded-md p-2 mt-2 "
                                        value={formData.updated_json.insuffDetails.first_insuff_reopened_date}
                                        onChange={handleChange}
                                    />
                                    {errors.first_insuff_reopened_date && (
                                        <p className="text-red-500 text-sm">{errors.first_insuff_reopened_date}</p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="second Level Insufficiency Remarks">Second Level Insufficiency Remarks</label>
                                    <select
                                        multiple
                                        id="second_insufficiency_marks"
                                        name="updated_json.insuffDetails.second_insufficiency_marks"
                                        value={formData.updated_json.insuffDetails.second_insufficiency_marks}
                                        onChange={handleChange}
                                        className="border border-gray-300 rounded-md p-2 mt-2 w-full focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 hover:h-42 focus:h-42 transition-all duration-300 ease-in-out capitalize text-gray-700 h-40"
                                    >
                                        {optionsData.map((group) => (
                                            <optgroup key={group.label} label={group.label} className="text-sm font-bold text-gray-700">
                                                {group.options.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                        className="hover:bg-gray-200 focus:bg-blue-100 transition-all duration-300 ease-in-out p-2"
                                                    >
                                                        {option.text}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>



                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="second Insuff Raised Date:">Second Insuff Raised Date:</label>
                                    <input
                                        type="date"
                                        name="updated_json.insuffDetails.second_insuff_date"
                                        id="second_insuff_date"
                                        value={formData.updated_json.insuffDetails.second_insuff_date}
                                        onChange={handleChange}
                                        className="border w-full rounded-md p-2 mt-2 "
                                    />

                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="second Insuff Cleared Date / Re-Opened date">Second Insuff Cleared Date / Re-Opened date</label>
                                    <input
                                        type="date"
                                        name="updated_json.insuffDetails.second_insuff_reopened_date"
                                        id="second_insuff_reopened_date"
                                        className="border w-full rounded-md p-2 mt-2 "
                                        value={formData.updated_json.insuffDetails.second_insuff_reopened_date}
                                        onChange={handleChange}
                                    />

                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="third Level Insufficiency Remarks">third Level Insufficiency Remarks</label>
                                    <select
                                        multiple
                                        id="third_insufficiency_marks"
                                        name="updated_json.insuffDetails.third_insufficiency_marks"
                                        value={formData.updated_json.insuffDetails.third_insufficiency_marks}
                                        onChange={handleChange}
                                        className="border border-gray-300 rounded-md p-2 mt-2 w-full focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 hover:h-42 focus:h-42 transition-all duration-300 ease-in-out capitalize text-gray-700 h-40"
                                    >
                                        {optionsData.map((group) => (
                                            <optgroup key={group.label} label={group.label} className="text-sm font-bold text-gray-700">
                                                {group.options.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                        className="hover:bg-gray-200 focus:bg-blue-100 transition-all duration-300 ease-in-out p-2"
                                                    >
                                                        {option.text}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>


                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="third Insuff Raised Date:">third Insuff Raised Date:</label>
                                    <input
                                        type="date"
                                        name="updated_json.insuffDetails.third_insuff_date"
                                        id="third_insuff_date"
                                        className="border w-full rounded-md p-2 mt-2 "
                                        value={formData.updated_json.insuffDetails.third_insuff_date}
                                        onChange={handleChange}
                                    />

                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="third Insuff Cleared Date / Re-Opened date">third Insuff Cleared Date / Re-Opened date</label>
                                    <input
                                        type="date"
                                        name="updated_json.insuffDetails.third_insuff_reopened_date"
                                        id="third_insuff_reopened_date"
                                        className="border w-full rounded-md p-2 mt-2 "
                                        value={formData.updated_json.insuffDetails.third_insuff_reopened_date}
                                        onChange={handleChange}
                                    />

                                </div>
                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500' htmlFor="overall_status">overall status</label>
                                    <select
                                        id='overall_status'
                                        ref={(el) => (inputRefs.current['overall_status'] = el)} // Add ref
                                        name="updated_json.insuffDetails.overall_status"
                                        value={formData.updated_json.insuffDetails.overall_status}
                                        onChange={handleChange}
                                        className="border rounded-md p-2 mt-2 uppercase w-full"
                                    >
                                        <option value="">Select Overall Status </option>
                                        <option value="insuff">insuff</option>
                                        <option value="initiated">initiated</option>
                                        <option value="wip">wip</option>
                                        <option value="hold">hold</option>
                                        <option value="completed" disabled={!allCompleted}  // Disable if not all statuses are completed
                                        >
                                            completed
                                        </option>
                                    </select>
                                    {errors.overall_status && (
                                        <p className="text-red-500 text-sm">{errors.overall_status}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="report date">report date</label>
                                        <input
                                            type="date"
                                            name="updated_json.insuffDetails.report_date"
                                            id="report_date"
                                            className="border rounded-md p-2 w-full mt-2 "
                                            value={formData.updated_json.insuffDetails.report_date}
                                            onChange={handleChange}
                                        />

                                    </div>
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="eport status">Report Status:</label>
                                        <select name="updated_json.insuffDetails.report_status" id=""
                                            value={formData.updated_json.insuffDetails.report_status}
                                            onChange={handleChange}
                                            className="border rounded-md p-2 mt-2 uppercase w-full">
                                            <option value="insuff">insuff</option>
                                            <option value="inititated">inititated</option>
                                            <option value="wip" >wip</option>
                                            <option value="hold">hold</option>
                                        </select>

                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="report status">Report Type:</label>
                                        <select name="updated_json.insuffDetails.report_type" id=""
                                            value={formData.updated_json.insuffDetails.report_type}
                                            onChange={handleChange}
                                            className="border rounded-md p-2 mt-2 uppercase w-full">
                                            <option value="insuff">insuff</option>
                                            <option value="inititated">inititated</option>
                                            <option value="wip" >wip</option>
                                            <option value="hold">hold</option>
                                        </select>

                                    </div>
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="Final Verification Status:">Final Verification Status:</label>
                                        <select name="updated_json.insuffDetails.final_verification_status"
                                            value={formData.updated_json.insuffDetails.final_verification_status}
                                            onChange={handleChange}
                                            id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="insuff">insuff</option>
                                            <option value="inititated">inititated</option>
                                            <option value="wip" >wip</option>
                                            <option value="hold">hold</option>
                                        </select>



                                    </div>
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500 ' htmlFor="deadline date">deadline date</label>
                                        <input
                                            type="date"
                                            name="updated_json.insuffDetails.deadline_date"
                                            id="deadline_date"
                                            className="border w-full rounded-md p-2 mt-2 "
                                            value={formData.updated_json.insuffDetails.deadline_date}
                                            onChange={handleChange}
                                        />

                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500 ' htmlFor="Address">Address</label>
                                        <select name="updated_json.insuffDetails.insuff_address"
                                            value={formData.updated_json.insuffDetails.insuff_address}
                                            onChange={handleChange}
                                            id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="yes">yes</option>
                                            <option value="no">no</option>
                                        </select>

                                    </div>
                                    <div className="mb-4 ">
                                        <label className='capitalize text-gray-500' htmlFor="basic entry">basic entry</label>
                                        <select name="updated_json.insuffDetails.basic_entry"
                                            value={formData.updated_json.insuffDetails.basic_entry}
                                            onChange={handleChange}
                                            id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="yes">yes</option>
                                            <option value="no">no</option>
                                        </select>

                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="mb-4 ">
                                        <label className='capitalize text-gray-500 ' htmlFor="education">education</label>
                                        <select name="updated_json.insuffDetails.education" id=""
                                            value={formData.updated_json.insuffDetails.education}
                                            onChange={handleChange}
                                            className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="yes">yes</option>
                                            <option value="no">no</option>
                                        </select>

                                    </div>

                                    <div className="mb-4">
                                        <label className='capitalize text-gray-500' htmlFor="case upload">case upload</label>
                                        <input
                                            type="text"
                                            name="updated_json.insuffDetails.case_upload"
                                            id="case_upload"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.insuffDetails.case_upload}
                                            onChange={handleChange}
                                        />

                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="mb-4 ">
                                        <label className='capitalize text-gray-500 block' htmlFor="Employment Spoc:">Employment Spoc:</label>
                                        <select name="updated_json.insuffDetails.emp_spoc" id=""
                                            value={formData.updated_json.insuffDetails.emp_spoc}
                                            onChange={handleChange}
                                            className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="yes">yes</option>
                                            <option value="no">no</option>
                                        </select>

                                    </div>
                                    <div className="mb-4 ">
                                        <label className='capitalize text-gray-500' htmlFor="Report Generated By:">Report Generated By:</label>
                                        <select name="updated_json.insuffDetails.report_generate_by"
                                            value={formData.updated_json.insuffDetails.report_generate_by}
                                            onChange={handleChange}
                                            id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="">Select Admin</option>
                                            {adminNames.map((spoc, index) => (
                                                <option key={index} value={spoc.id}>{spoc.name}</option>
                                            ))}


                                        </select>

                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="mb-4 ">
                                        <label className='capitalize block text-gray-500' htmlFor="QC Done By:">QC Done By:</label>

                                        <select name="updated_json.insuffDetails.qc_done_by"
                                            value={formData.updated_json.insuffDetails.qc_done_by}
                                            onChange={handleChange}
                                            id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="">Select Admin</option>
                                            {adminNames.map((spoc, index) => (
                                                <option key={index} value={spoc.id}>{spoc.name}</option>
                                            ))}

                                        </select>

                                    </div>
                                    <div className="mb-4 ">
                                        <label className='capitalize block text-gray-500' htmlFor="qc_date">QC Date:</label>
                                        <input
                                            type="date"
                                            name="updated_json.insuffDetails.qc_date"
                                            id="qc_date"
                                            className="w-full border p-2 outline-none rounded-md mt-2"
                                            value={formData.updated_json.insuffDetails.qc_date}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="Remarks & reason for Delay:">Remarks & reason for Delay:</label>
                                    <select
                                        multiple
                                        id="delay_reason"
                                        name="updated_json.insuffDetails.delay_reason"
                                        value={formData.updated_json.insuffDetails.delay_reason || []}  // Ensure it's an array
                                        onChange={handleChange}
                                        className="border border-gray-300 rounded-md p-2 mt-2 w-full focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 hover:h-42 focus:h-42 transition-all duration-300 ease-in-out capitalize text-gray-700 h-40"
                                    >
                                        {optionsData.map((group) => (
                                            <optgroup key={group.label} label={group.label} className="text-sm font-bold text-gray-700">
                                                {group.options.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                        className="hover:bg-gray-200 focus:bg-blue-100 transition-all duration-300 ease-in-out p-2"
                                                    >
                                                        {option.text}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>


                                </div>
                                <div className="mb-4">
                                    <label className="capitalize text-gray-500" htmlFor="is_verified_by_quality_team">
                                        Is verified by quality team
                                        <span className="text-red-500 text-xl">*</span>
                                    </label>
                                    <div className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            name="updated_json.insuffDetails.is_verify_yes"
                                            id="is_verified_yes"
                                            checked={formData.updated_json.insuffDetails.is_verify === "yes"}
                                            onChange={(e) => handleChange({
                                                target: {
                                                    name: "updated_json.insuffDetails.is_verify",
                                                    value: e.target.checked ? "yes" : formData.updated_json.insuffDetails.is_verify
                                                }
                                            })}
                                            className="w-4 h-4 border rounded-md mr-2"
                                        />
                                        <span className="uppercase">Yes</span>

                                        <input
                                            type="checkbox"
                                            name="updated_json.insuffDetails.is_verify_no"
                                            id="is_verified_no"
                                            checked={formData.updated_json.insuffDetails.is_verify === "no"}
                                            onChange={(e) => handleChange({
                                                target: {
                                                    name: "updated_json.insuffDetails.is_verify",
                                                    value: e.target.checked ? "no" : formData.updated_json.insuffDetails.is_verify
                                                }
                                            })}
                                            className="w-4 h-4 border rounded-md ml-4 mr-2"
                                        />
                                        <span className="uppercase">No</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-left mt-4">
                                <div className='notmandatory mb-4 items-baseline flex gap-2'>
                                    <input
                                        type="checkbox"
                                        name="notMandatory"
                                        id="notMandatory"
                                        className="border rounded-md p-2 mt-2 capitalize"
                                        onChange={(e) => setIsNotMandatory(e.target.checked)}
                                    />
                                    <label className='capitalize text-gray-500'>Not Mandatory Fields</label>
                                </div>

                                <button
                                    type="submit"
                                    className="p-6 py-3 bg-[#2c81ba] text-white font-bold rounded-md hover:bg-[#0f5381] transition duration-200 "
                                >
                                    Submit
                                </button>
                                <button

                                    onClick={handlePreview}
                                    className="p-6 py-3 bg-green-600 text-white ml-5 font-bold rounded-md hover:bg-green-600 transition duration-200 "
                                >
                                    Preview
                                </button>

                            </div>
                        </form>
                    )}
                </div>
            </div >
        </div>
    );
};

export default GenerateReport;
