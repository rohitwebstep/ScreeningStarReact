import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import Swal from 'sweetalert2';
const CaseAllocation = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
      const {validateAdminLogin,setApiLoading,apiLoading} = useApiLoading();


    const [referenceIds, setReferenceIds] = useState([]);
    const [services, setServices] = useState([]);
    const [formData, setFormData] = useState({
        month: '',
        initiationDate: '',
        employeeId: '',
        referenceId: '',
        applicantName: '',
        dateOfBirth: '',
        gender: '',
        mobileNumber: '',
        alternateNumber: '',
        fatherOrSpouseName: '',
        address: '',
        scopeOfService: [],
        colorCode: '',
        vendorName: '',
        deadlineDate: '',
        reportDate: '',
        caseAging: '',
        remarks: '',
    });
    const [errors, setErrors] = useState({});
    const [applications, setApplications] = useState([]);

// Fetch Applications
const fetchApplication = useCallback(() => {
    setLoading(true);
    setApiLoading(true);
    const token = localStorage.getItem('_token');
    let apiResult = null; // Define a variable to store the result

    fetch(`https://api.screeningstar.co.in/client-allocation/applications`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Assuming Bearer token is required
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((result) => {
            apiResult = result; // Store result in apiResult

            if (result.token) {
                localStorage.setItem('_token', result.token);
            }

            const data = result.data || {};
            const { applications = [], services = [] } = data;

            setApplications(applications);

            const referenceOptions = applications.map((app, index) => ({
                value: app.application_id,
                label: app.application_id,
                key: `${app.application_id}-${index}` // Ensure key is unique
            }));

            const serviceOptions = services.map((service, index) => ({
                value: service.id,
                label: service.title,
                key: `${service.title}-${index}` // Ensure key is unique
            }));

            setReferenceIds(referenceOptions);
            setServices(serviceOptions);
        })
        .catch((error) => console.error('Error fetching applications:', error))
        .finally(() => {
            // Always save the token using apiResult
            const newToken = apiResult?.token || apiResult?._token || token || "";
            if (newToken) {
                localStorage.setItem('_token', newToken);
            }
            setLoading(false);
            setApiLoading(false);
        });
}, [setApplications, setReferenceIds, setServices, setLoading , ]);





    const handleChange = (e) => {
        const { name, value } = e.target;

        console.log('e ---', name, 'value ---', value);
        console.log('applications', applications);

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
            const year = String(date.getFullYear()).slice(2); // Extract last two digits of the year

            return `${day}-${month}-${year}`;
        };

        setFormData((prev) => {
            if (name === 'referenceId') {
                console.log('Comparing:', value);
                const selectedService = applications.find(app => app.application_id === String(value));
                console.log('Selected Service:', selectedService);

                if (selectedService) {
                    return {
                        ...prev,
                        month: selectedService.month_year || '',
                        initiationDate: selectedService.created_at
                            ? new Date(selectedService.created_at).toISOString().split('T')[0]
                            : '',
                        employeeId: selectedService.employee_id || '',
                        referenceId: selectedService.application_id || '',
                        applicantName: selectedService.name || '',
                        dateOfBirth: selectedService.dob
                            ? new Date(selectedService.dob).toISOString().split('T')[0]
                            : '',
                        gender: selectedService.gender || '',
                        mobileNumber: selectedService.contact_number || '',
                        alternateNumber: selectedService.contact_number2 || '',
                        fatherOrSpouseName: selectedService.father_name || selectedService.spouse_name || '',
                        address: [
                            selectedService.permanent_address_house_no,
                            selectedService.permanent_address_floor,
                            selectedService.permanent_address_cross,
                            selectedService.permanent_address_street,
                            selectedService.permanent_address_main,
                            selectedService.permanent_address_area,
                            selectedService.permanent_address_locality,
                            selectedService.permanent_address_city,
                            selectedService.permanent_address_landmark,
                            selectedService.permanent_address_taluk,
                            selectedService.permanent_address_district,
                            selectedService.permanent_address_state,
                            selectedService.permanent_address_pin_code
                        ].filter(Boolean).join(', '),
                        scopeOfService: value,
                        colorCode: '',
                        vendorName: '',
                        deadlineDate: selectedService.deadline_date
                            ? new Date(selectedService.deadline_date).toISOString().split('T')[0]
                            : '',
                        reportDate: selectedService.report_date || '',
                        caseAging: '',
                        remarks: '',
                    };
                } else {
                    console.log('No service found for this application ID');
                }
            }

            // Handle multiple selection case for scopeOfService
            if (name === 'scopeOfService') {
                const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
                return { ...prev, [name]: selectedOptions }; // Update scopeOfService with selected array
            }

            // Default case for other fields
            return { ...prev, [name]: value };
        });
    };



    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        // Form validation
        // Add similar validation for other fields

        // If there are errors, return early without making the API call
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // If no errors, prepare and send the data
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "application_id": formData.referenceId,
            "service_ids": JSON.stringify(formData.scopeOfService),
            "employee_id": formData.employeeId,
            "name": formData.applicantName,
            "month_year": formData.month,
            "created_at": formData.initiationDate,
            "dob": formData.dateOfBirth,
            "gender": formData.gender,
            "contact_number": formData.mobileNumber,
            "contact_number2": formData.alternateNumber,
            "father_name": formData.fatherOrSpouseName,
            "spouse_name": formData.fatherOrSpouseName,
            "permanent_address": formData.address,
            "deadline_date": formData.deadlineDate,
            "report_date": formData.reportDate,
            "color_code": formData.colorCode,
            "vendor_name": formData.vendorName,
            "case_aging": formData.caseAging,
            "remarks": formData.remarks,
            "admin_id": admin_id,
            "_token": storedToken
        });

        const requestOptions = {
            method: "POST",  // Corrected from GET to POST
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch("https://api.screeningstar.co.in/client-allocation/create", requestOptions)
        .then((response) => response.json()) // Assuming the response is JSON
        .then((result) => {
            const newToken = result?.token || result?._token || storedToken || "";
            if (newToken) {
                localStorage.setItem('_token', newToken);
            }
          if (result.status == true) { // Assuming the API response contains a 'success' field
            Swal.fire({
              title: "Success!",
              text: result.message || "Client allocation created successfully.",
              icon: "success",
              confirmButtonText: "OK"
            });
          } else {
            Swal.fire({
              title: "Error!",
              text: result.message || "Failed to create client allocation.",
              icon: "error",
              confirmButtonText: "Try Again"
            });
          }
        })
        .catch((error) => {
          console.error(error);
          Swal.fire({
            title: "Error!",
            text: "An unexpected error occurred. Please try again later.",
            icon: "error",
            confirmButtonText: "OK"
          });
        });
      

        console.log('Form submitted:', formData);  // This can be removed once form is successfully submitted
    };


    // Initialization
    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                await validateAdminLogin();
                await fetchApplication();
                }
            } catch (error) {
                console.error('Error during initialization:', error.message);
                navigate('/admin-login');
            }
        };

        initialize();
    }, [navigate, fetchApplication]);

    return (
        <div className="w-full border border-black overflow-hidden">
            <div className="bg-white text-left p-12 w-full mx-auto">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Month</label>
                        <input
                            type="text"
                            name="month"
                            value={formData.month}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Date of Initiation </label>
                        <input
                            type="date"
                            name="initiationDate"
                            value={formData.initiationDate}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Employee ID </label>
                        <input
                            type="text"
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Reference ID</label>
                        <select
                            name="referenceId"
                            value={formData.referenceId}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select Reference ID</option>
                            {referenceIds.map((ref) => (
                                <option key={ref.value} value={ref.value}>
                                    {ref.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Name of the Applicant</label>
                        <input
                            type="text"
                            name="applicantName"
                            value={formData.applicantName}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Date of Birth</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Gender</label>
                        <input
                            type="text"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Mobile Number</label>
                        <input
                            type="tel"
                            name="mobileNumber"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Alternate Number</label>
                        <input
                            type="tel"
                            name="alternateNumber"
                            value={formData.alternateNumber}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Father Name / Spouse Name</label>
                        <input
                            type="text"
                            name="fatherOrSpouseName"
                            value={formData.fatherOrSpouseName}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        ></textarea>
                    </div>

                    {/* Scope of Service */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Scope of Service</label>
                        <select
                            name="scopeOfService"
                            value={formData.scopeOfService}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            multiple
                        >
                            <option value="">Select Scope of Service</option>
                            {services.map((service) => (
                                <option key={service.value} value={service.value}>
                                    {service.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Color Code</label>
                        <input
                            type="text"
                            name="colorCode"
                            value={formData.colorCode}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Name of the Vendor</label>
                        <input
                            type="text"
                            name="vendorName"
                            value={formData.vendorName}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Deadline Date</label>
                        <input
                            type="date"
                            name="deadlineDate"
                            value={formData.deadlineDate}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Report Date</label>
                        <input
                            type="date"
                            name="reportDate"
                            value={formData.reportDate}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Case Aging</label>
                        <input
                            type="text"
                            name="caseAging"
                            value={formData.caseAging}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Remarks</label>
                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        ></textarea>
                    </div>
                    <div className="text-left">
                        <button
                            type="submit"
                            className="p-6 py-3 bg-[#2c81ba] hover:scale-105 text-white font-bold rounded-md hover:bg-[#0f5381]"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CaseAllocation;
