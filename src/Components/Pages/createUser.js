import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useApiLoading } from '../ApiLoadingContext';

const CreateUser = () => {
  const navigate = useNavigate();
       const {validateAdminLogin,setApiLoading,apiLoading} = useApiLoading();

  
  const [formData, setFormData] = useState({
    employeePhoto: '',
    employeeName: '',
    employeeMobile: '',
    employeeId: '',
    email: '',
    password: '',
    date_of_joining: '',
    designation: '',
    role: '',
    services: '',

  });
  const [fileName, setFileName] = useState('');

  const [services, setServices] = useState([]);

  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [files, setFiles] = useState({});
  const [adminRoles, setAdminRoles] = useState([]);
  const [loading, setLoading] = useState(true);


  const fetchAdminRoleList = useCallback(() => {
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

    fetch(`https://api.screeningstar.co.in/admin/create-listing?admin_id=${adminId}&_token=${token}`, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        const newToken = result.token || result._token || token ||'';
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
        const roles = result.data.roles?.map(roleObj => roleObj.role) || [];
        const services = result.data.services?.map(service => ({ id: service.id, title: service.title })) || [];
        setAdminRoles(roles);
        setServices(services);
      })
      .catch((error) => console.error(error)).finally(() => {
        setLoading(false);
        setApiLoading(false);
      });
  }, []);

  console.log(`service_groups`, services);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoading == false) {
        await validateAdminLogin();
        await fetchAdminRoleList();
        }
      } catch (error) {
        console.error(error.message);
        navigate('/admin-login');
      }
    };

    initialize();
  }, [navigate, fetchAdminRoleList]);


  const handleChange = (e) => {
    const { name, value, options, multiple } = e.target;

    // Handle multiple selection for "services"
    if (name === "services" && multiple) {
      const selectedValues = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value);

      setFormData({
        ...formData,
        [name]: selectedValues, // Update services as an array
      });
      return;
    }

    // Validation for specific fields during input
    if (name === "employeeName" || name === "designation") {
      const regex = /^[a-zA-Z\s]*$/;
      if (!regex.test(value)) return;
    }

    if (name === "employeeMobile") {
      const regex = /^[0-9]*$/;
      if (!regex.test(value)) return;
    }

    // Update form data
    setFormData({ ...formData, [name]: value });

    // Clear error for the current field if it's now valid
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      if (name === "employeeMobile" && /^\d{10}$/.test(value)) {
        delete newErrors.employeeMobile;
      }
      if (name === "email" && /\S+@\S+\.\S+/.test(value)) {
        delete newErrors.email;
      }
      if (name === "password" && value.length >= 6) {
        delete newErrors.password;
      }
      if (value.trim()) {
        delete newErrors[name];
      }
      return newErrors;
    });
  };


  const validateForm = () => {
    const newErrors = {};
    if (!files["profile-picture"]) { newErrors.employeePhoto = "Employee Photo is required." }
    if (!formData.employeeName) newErrors.employeeName = "Employee Name is required.";
    if (!formData.employeeMobile) newErrors.employeeMobile = "Employee Mobile is required.";
    if (!formData.employeeId) {
      newErrors.employeeId = "Employee ID is required.";
    } else if (/[^a-zA-Z0-9_-]/.test(formData.employeeId)) {
      newErrors.employeeId = "Employee ID must not contain special characters or spaces ";
    } else if (/\s/.test(formData.employeeId)) {
      newErrors.employeeId = "Employee ID must not contain spaces.";
    }
    if (!formData.services) newErrors.services = "services is required.";
    if (!/^\d{10}$/.test(formData.employeeMobile)) newErrors.employeeMobile = "Mobile must be 10 digits.";
    if (!formData.email) newErrors.email = "Email is required.";
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid.";
    if (!formData.password) newErrors.password = "Password is required.";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    if (!formData.designation) newErrors.designation = "Designation is required.";
    if (!formData.date_of_joining) newErrors.date_of_joining = "Date is required.";
    if (!formData.role) newErrors.role = "Role is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setErrors((prevErrors) => ({ ...prevErrors, employeePhoto: null }));
    }

    setFiles((prevFiles) => ({ ...prevFiles, ["profile-picture"]: selectedFiles }));
  };

  const uploadAdminProfilePicture = async (insertedId, password, adminId, token) => {
    const fileCount = Object.keys(files).length;
    console.log(`File count: ${fileCount}`);

    if (fileCount > 0) {
      for (const [key, value] of Object.entries(files)) {
        console.log(`Processing files for key: ${key}`);

        const formData = new FormData();
        formData.append("admin_id", adminId); // Ensure adminId is defined
        formData.append("_token", token); // Ensure token is defined
        formData.append("id", insertedId);
        formData.append("password", password); // Replace with actual password value
        formData.append("send_mail", 1);

        for (const file of value) {
          formData.append('images', file);
        }

        try {
          console.log("Sending POST request to upload files...");
          const response = await axios.post(`https://api.screeningstar.co.in/admin/upload`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          console.log("Upload response:", response.data);
          const token = localStorage.getItem("_token");
          // Save the new token if present in the response
          const newToken = response.data._token || response.data.token || token;
          if (newToken) {
            console.log('token is saved ' ,newToken)
            localStorage.setItem("_token", newToken );
          }

          return;
        } catch (err) {
          console.error("Error occurred:", err);
          Swal.fire('Error!', `An error occurred while uploading profile picture: ${err.message}`, 'error');
          const token = localStorage.getItem("_token");

          // Save the new token even in case of failure
          const newToken = err.response?.data._token || err.response?.data.token || token;
          if (newToken) {
            localStorage.setItem("_token", newToken);
          }
        }
      }
    } else {
      console.warn(`Upload image first`);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Failed",
        text: "Please ensure all fields are filled out correctly.",
      });
      return;
    }

    setLoading(true); // Set loading to true when the form is submitted

    const adminData = JSON.parse(localStorage.getItem("admin")) || {};
    const token = localStorage.getItem("_token");
    const adminId = adminData.id;
    const fileCount = Object.keys(files).length;
    const isFileUploading = fileCount > 0;

    const formPayload = {
      admin_id: adminId,
      _token: token,
      name: formData.employeeName,
      mobile: formData.employeeMobile,
      employee_id: formData.employeeId,
      email: formData.email,
      password: formData.password,
      date_of_joining: formData.date_of_joining,
      designation: formData.designation,
      role: formData.role,
      service_ids: formData.services.join(','),
      employeePhoto: formData.employeePhoto,
      send_mail: isFileUploading ? 0 : 1,
    };

    try {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPayload),
        redirect: "follow",
      };

      const response = await fetch(
        "https://api.screeningstar.co.in/admin/create",
        requestOptions
      );

      const result = await response.json();
      const newToken = result._token || result.token || token;
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }
      if (result.status) {
        setSubmitMessage("User created successfully!");
        setFormData({
          employeePhoto: "",
          employeeName: "",
          employeeMobile: "",
          employeeId: "",
          email: "",
          password: "",
          date_of_joining: "",
          designation: "",
          role: "",
        });

        const insertId = result?.result?.insertId;
        if (insertId) {
          if (isFileUploading) {
            await uploadAdminProfilePicture(insertId, formData.password, adminId, token);
          }
          setFileName("");
          Swal.fire({
            icon: "success",
            title: "User Created",
            text: "User has been created successfully!",
          }).then(() => {
            navigate("/admin-existing-users");
          });
        } else {
          throw new Error("Failed to retrieve insertId.");
        }
      } else {
        setSubmitMessage("Failed to create user.");
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.error,
        });
      }
    } catch (error) {
      console.error("Error uploading user data:", error);
      setSubmitMessage("Failed to create user.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create user. Please try again later.",
      });
    } finally {
      setLoading(false); // Set loading to false after the operation completes
    }
  };


  const formatRole = (role) => {
    return role
      .replace(/[^a-zA-Z0-9\s]/g, " ") // Replace special characters with spaces
      .split(" ") // Split into words
      .filter(Boolean) // Remove empty strings from the array
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
      .join(" "); // Join words with spaces
  };
  return (
    <div className="w-full  border border-black overflow-hidden">
      <div className="bg-white text-left p-12 w-full mx-auto">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="employeePhoto" className="block mb-1 ">
              Employee Photo <span className="text-red-500 text-xl">*</span>
            </label>
            <div className="relative mb-[20px]">
              <input
                type="file"
                name="employeePhoto"
                id="employeePhoto"
                className={`border ${errors.employeePhoto ? 'border-red-500' : 'border-gray-300'} w-full capitalize rounded-md p-2 mt-2 outline-none`}
                onChange={(e) => handleFileChange(e)}
              />
            </div>

            {errors.employeePhoto && <p className="text-red-500 text-sm">{errors.employeePhoto}</p>}
          </div>
          <div>
            <label htmlFor="employeeName" className="block mb-1 ">
              Employee Name <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="text"
              name="employeeName"
              placeholder="Employee Name"
              value={formData.employeeName}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.employeeName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.employeeName && <p className="text-red-500 text-sm">{errors.employeeName}</p>}
          </div>
          <div>
            <label htmlFor="employeeId" className="block mb-1 ">
              Employee ID <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="text"
              name="employeeId"
              placeholder="Employee Id"
              value={formData.employeeId}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.employeeId ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
          </div>
          <div>
            <label htmlFor="employeeMobile" className="block mb-1 ">
              Employee Mobile <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="text"
              name="employeeMobile"
              placeholder="Employee Mobile"
              value={formData.employeeMobile}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.employeeMobile ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.employeeMobile && <p className="text-red-500 text-sm">{errors.employeeMobile}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 ">
              Email <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="designation" className="block mb-1 ">
              Password <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="designation" className="block mb-1 ">
              Designation <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="text"
              name="designation"
              placeholder="Designation"
              value={formData.designation}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.designation ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.designation && <p className="text-red-500 text-sm">{errors.designation}</p>}
          </div>
          <div>
            <label htmlFor="dateofJoining" className="block mb-1 ">
              Date of Joining <span className="text-red-500 text-xl">*</span>
            </label>
            <input
              type="date"
              name="date_of_joining"
              value={formData.date_of_joining}
              onChange={handleChange}
              className={`w-full p-3 mb-[20px] border ${errors.date_of_joining ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.date_of_joining && <p className="text-red-500 text-sm">{errors.date_of_joining}</p>}
          </div>
          <div>
            <label htmlFor="role" className="block mb-1">
              Role <span className="text-red-500 text-xl">*</span>
            </label>
            {loading ? (
              <select
                className={`w-full p-3 mb-[20px] border rounded-md ${loading ? "opacity-50 bg-gray-200 cursor-not-allowed" : ""
                  }`}
                name="role"
              >
                <option value="">

                  <div className="flex w-full justify-center items-center h-20">
                    <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                  </div></option>

              </select>
            ) : (
              <select
                className={`w-full p-3 mb-[20px] border ${errors.role ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="">Select Role</option>
                {adminRoles.map((role, index) => (
                  <option key={index} value={role}>
                    {formatRole(role)}
                  </option>
                ))}
              </select>
            )}
            {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
          </div>




          <div>
            <label htmlFor="services" className="block mb-1">
              Services <span className="text-red-500 text-xl">*</span>
            </label>
            {loading ? (
              <select
                className={`w-full p-3 mb-[20px] border rounded-md ${loading ? "opacity-50 bg-gray-200 cursor-not-allowed" : ""
                  }`}
                name="role"
              >
                <option value="">

                  <div className="flex w-full justify-center items-center h-20">
                    <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                  </div></option>

              </select>
            ) : (
              
              <select
                className={`w-full p-3 mb-[20px] border ${errors.services ? 'border-red-500' : 'border-gray-300'
                  } rounded-md`}
                name="services"
                value={formData.services} // Ensure `formData.services` is an array
                onChange={handleChange}
                multiple // Enable multiple selection
              >
                <option value="" disabled>
                  Select Service
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title}
                  </option>
                ))}
              </select>
            )}
            {errors.services && <p className="text-red-500 text-sm">{errors.services}</p>}
          </div>

          <div className='text-left'>
            <button type="submit" className={`p-6 py-3 bg-[#2c81ba]  hover:scale-105 text-white font-bold rounded-md hover:bg-[#0f5381] ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
