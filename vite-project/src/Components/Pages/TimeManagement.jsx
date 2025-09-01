import React, { useEffect, useState, useCallback } from "react";
import Swal from 'sweetalert2';
import swal from 'sweetalert';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import axios from 'axios';

const TimeManagement = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const navigate = useNavigate();
    const [spocs, setSpocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingButton, setLoadingButton] = useState(null); // store the currently loading button

    const storedToken = localStorage.getItem("_token");
    let adminData;
    if (storedToken) {
        adminData = JSON.parse(localStorage.getItem('admin'))
    }
    const [formData, setFormData] = useState({
        ticket_date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
        photo: adminData.profile_picture,
        employee_name: adminData.name,
        employee_id: adminData.emp_id,
        leave_date: "",
        from_date: "",
        to_date: "",
        purpose_of_leave: "",
        remarks: "",
        personal_manager_id: ""
    });
    console.log('adminData---', adminData)
    const fetchData = useCallback(() => {
        setLoading(true);
        setApiLoading(true);

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        // Check if admin_id or storedToken is missing
        if (!admin_id || !storedToken) {
            console.error('Missing admin_id or _token');
            setLoading(false);
            setApiLoading(false); // Ensure loading is stopped if missing data
            return;
        }

        // Construct the URL with query parameters
        const url = `https://api.screeningstar.co.in/personal-manager/list?admin_id=${admin_id}&_token=${storedToken}`;

        // Request options for GET request (no body required)
        const requestOptions = {
            method: "GET", // GET method does not need a body
            redirect: "follow",
        };

        fetch(url, requestOptions)
            .then((response) => {
                const newToken = response.token || response._token || storedToken || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Store new token if available
                }
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse response body as JSON
            })
            .then((result) => {

                const newToken = result.token || result._token || storedToken || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Store new token if available
                }
 
                // Assuming result.billing_spocs is an array
                try {
                    setSpocs(result.services);
                } catch (error) {
                    console.error('Failed to parse JSON:', error);
                }
            })
            .catch((error) => {
                console.error('Fetch error:', error);
            })
            .finally(() => {
                setLoading(false);
                setApiLoading(false);// Stop loading
            });

    }, []);

    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin(); // Verify admin first
                    await fetchData(); // Fetch data after verification
                }
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login'); // Redirect if validation fails
            }
        };

        initialize(); // Execute the sequence
    }, [navigate, fetchData]);

    const handleClick = (ButtonName) => {
        setLoadingButton(ButtonName); // Set loading state
    
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
    
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
    
        const raw = JSON.stringify({
            type: ButtonName,
            admin_id: admin_id,
            _token: storedToken,
        });
    
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };
    
        fetch("https://api.screeningstar.co.in/personal-manager/break", requestOptions)
            .then((response) => response.json()) // <-- FIXED: parse JSON
            .then((result) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: result.message || "Action completed successfully.",
                });
                console.log(result);
                setTimeout(() => {
                    console.log(`${ButtonName} action completed`);
                    setLoadingButton(null); // Reset loading
                }, 1000);
            })
            .catch((error) => {
                console.error("Error occurred:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Something went wrong. Please try again.',
                });
                setLoadingButton(null); // Reset loading on error as well
            });
    };
    
    
    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const buttons = [
        { label: "LOGIN", color: "bg-blue-500", hover: "hover:bg-blue-600" },
        { label: "TEA BREAK IN-1", color: "bg-green-500", hover: "hover:bg-green-600" },
        { label: "TEA BREAK OUT-1", color: "bg-yellow-500", hover: "hover:bg-yellow-600" },
        { label: "LUNCH BREAK IN", color: "bg-purple-500", hover: "hover:bg-purple-600" },
        { label: "LUNCH BREAK OUT", color: "bg-purple-500", hover: "hover:bg-purple-600" },
        { label: "TEA BREAK IN-2", color: "bg-yellow-500", hover: "hover:bg-yellow-600" },
        { label: "TEA BREAK OUT-2", color: "bg-green-500", hover: "hover:bg-green-600" },
        { label: "LOGOUT", color: "bg-red-500", hover: "hover:bg-red-600" },
    ];
    return (

        <div className="bg-white md:p-12 p-6 border border-black w-full mx-auto rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-6 text-center">Time Management</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                    {buttons.map((btn, index) => (
                        <button
                            key={index}
                            disabled={loadingButton === btn.label}

                            className={`${btn.color} text-white w-full py-3 px-4 ${btn.color} ${btn.hover} ${
                                loadingButton === btn.label ? "opacity-50 cursor-not-allowed" : "transform hover:scale-105 transition-transform duration-200"
                            } rounded-xl shadow ${btn.hover} transition`}
                            onClick={() => handleClick(btn.label)}
                        >
                            {btn.label}
                        </button>
                    ))}
            </div>
        </div>


    );
};

export default TimeManagement;