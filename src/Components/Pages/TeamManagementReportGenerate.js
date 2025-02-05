import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs } from "swiper";
import { FaChevronLeft } from 'react-icons/fa';

import "swiper/css";

const TeamManagementGenerateReport = () => {
    const navigate = useNavigate();
    const [thumbsSwiper, setThumbsSwiper] = useState(null);

    const [loading, setLoading] = useState(true);
    const [servicesDataInfo, setServicesDataInfo] = useState([]);
    const [branchInfo, setBranchInfo] = useState({});
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(""); // "selected" or "preselected"
    const openModal = (type) => {
        setModalType(type);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
    };
    const [files, setFiles] = useState({});
    const [applicationRefID, setApplicationRefID] = useState("");
    const [clientCode, setClientCode] = useState("");
    console.log('servicesDataInfo', servicesDataInfo)
    const applicationId = new URLSearchParams(window.location.search).get("applicationId");
    const branchid = new URLSearchParams(window.location.search).get("branchid");

    // Fetch Data
    const fetchApplicationData = useCallback(() => {
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");

        fetch(
            `https://api.screeningstar.co.in/team-management/application-by-id?application_id=${applicationId}&branch_id=${branchid}&admin_id=${adminId}&_token=${token}`
        )
            .then((response) => response.json())
            .then((result) => {
                setLoading(false);
                setBranchInfo(result.branchInfo || {});
                setServicesDataInfo(result.results?.filter(Boolean) || []);
                setClientCode(result.CMTData?.client_code || "");
                setApplicationRefID(result.application?.application_id || "");
                setSelectedStatuses(
                    result.results?.map((serviceData) => serviceData?.annexureData?.status || "") || []
                );
                setSelectedImages(
                    result.results?.map((serviceData) => serviceData?.annexureData?.team_management_docs || "") || []
                )
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setLoading(false);
            });
    }, [applicationId, branchid]);

    useEffect(() => {
        fetchApplicationData();
    }, [fetchApplicationData]);

    const handleStatusChange = (e, dbTable, index) => {
        const updatedStatuses = [...selectedStatuses];
        updatedStatuses[index] = e.target.value;
        setSelectedStatuses(updatedStatuses);
    };

    const handleFileChange = (index, dbTable, heading, e) => {
        const selectedFiles = Array.from(e.target.files);

        setFiles((prevFiles) => ({
            ...prevFiles,
            [dbTable]: { selectedFiles, fileName: heading },
        }));
    };

    // Upload Files API
    const uploadCustomerLogo = async () => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            console.error("Admin ID or token not found in local storage.");
            return false;
        }

        for (const [dbTable, value] of Object.entries(files)) {
            const formData = new FormData();
            formData.append("admin_id", admin_id);
            formData.append("_token", storedToken);
            formData.append("client_application_id", applicationId);
            formData.append("branch_id", branchid);
            formData.append("customer_code", clientCode);
            formData.append("application_code", applicationRefID);

            formData.append("db_table", dbTable);

            if (value.selectedFiles?.length > 0) {
                value.selectedFiles.forEach((file) => {
                    if (file instanceof File) {
                        formData.append("images", file);
                    }
                });

                formData.append("db_column", value.fileName);
            }

            try {
                const response = await axios.post(
                    "https://api.screeningstar.co.in/team-management/upload",
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
                const data = response.data;
                if (data.token || data._token) {
                    localStorage.setItem("_token", data.token || data._token);
                }
            } catch (err) {
                console.error("Error uploading file:", err.message || err);
                return false;
            }
        }

        return true;
    };

    // Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const uploadSuccess = await uploadCustomerLogo();
        if (!uploadSuccess) {
            Swal.fire("Error", "Failed to upload files. Submission aborted.", "error");
            setLoading(false);
            return;
        }

        try {
            const adminData = JSON.parse(localStorage.getItem("admin"));
            const token = localStorage.getItem("_token");

            const statuses = servicesDataInfo
                .map((serviceData, index) => {
                    console.log(serviceData);
                    const jsonData = serviceData?.reportFormJson?.json
                        ? JSON.parse(serviceData.reportFormJson.json)
                        : null;

                    const dbTable = jsonData?.db_table;
                    return selectedStatuses[index]
                        ? {
                            db_table: dbTable,
                            service_id: serviceData.service_id,
                            status: selectedStatuses[index],
                        }
                        : null;
                })
                .filter(Boolean);

            const payload = JSON.stringify({
                admin_id: adminData?.id,
                _token: token,
                branch_id: branchid,
                customer_id: branchInfo.customer_id,
                application_id: applicationId,
                statuses,
                send_mail: 0,
            });

            const response = await fetch(
                "https://api.screeningstar.co.in/team-management/generate-report",
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: payload,
                }
            );
            const newToken = response.token ||
                response._token ||
                localStorage.getItem("_token");

            if (newToken) {
                console.log("Saving token:", newToken);
                localStorage.setItem("_token", newToken);
            }
            if (!response.ok) throw new Error("Failed to submit data");

            Swal.fire("Success", "Report generated successfully!", "success");
            const branchidFromUrl = new URLSearchParams(window.location.search).get('branchid');
            const clientIdFromUrl = new URLSearchParams(window.location.search).get('clientId');

            const branchId = branchidFromUrl;
            const customerId = clientIdFromUrl;
            navigate(`/admin-TeamManagementCheckin?clientId=${customerId}&branchId=${branchId}`);
        } catch (err) {
            console.error("Error during submission:", err);
            Swal.fire("Error", "Failed to submit data.", "error");
        } finally {
            setLoading(false);
        }
    };


    const handleGoBack = () => {
        const branchidFromUrl = new URLSearchParams(window.location.search).get('branchid');
        const clientIdFromUrl = new URLSearchParams(window.location.search).get('clientId');

        const branchId = branchidFromUrl;
        const customerId = clientIdFromUrl;

        navigate(`/admin-TeamManagementCheckin?clientId=${customerId}&branchId=${branchId}`);
    }
    return (
        <div className="bg-[#c1dff2] border border-black">
            <h2 className="text-2xl font-bold py-3 text-left text-[#4d606b] px-3 border">
                GENERATE REPORT
            </h2>
            <div className="bg-white p-12 w-full border-t border-black mx-auto">

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
                        <form className="space-y-4" autoComplete="off" >
                            <div className="SelectedServices border border-black p-5 rounded-md">
                                <h1 className="text-center text-2xl">
                                    SELECTED SERVICES<span className="text-red-500 text-xl">*</span>
                                </h1>

                                {servicesDataInfo.length > 0 && servicesDataInfo.some(serviceData => serviceData.serviceStatus) ? (
                                    servicesDataInfo.map((serviceData, index) => {
                                        if (serviceData.serviceStatus) {
                                            const formJson = JSON.parse(serviceData.reportFormJson.json);
                                            const preselectedStatus = selectedStatuses[index] || "";
                                            const preselectedImage = selectedImages[index] || "";
                                            const dbTable = formJson.db_table;

                                            // Extract images from the serviceData.annexureData.team_management_docs
                                            const serviceImages = serviceData.annexureData?.team_management_docs?.split(",") || [];

                                            return (
                                                <>
                                                    <div key={index} className="mb-6 flex items-center  justify-between mt-5">
                                                        {formJson.heading && (
                                                            <>
                                                                <span className="w-3/12 font-semibold">{formJson.heading}</span>
                                                                <select
                                                                    className="border p-2 w-4/12 rounded-md"
                                                                    value={preselectedStatus}
                                                                    onChange={(e) => handleStatusChange(e, dbTable, index)}
                                                                >
                                                                    <option value="">--Select status--</option>
                                                                    <option value="nil">NIL</option>
                                                                    <option value="initiated">INITIATED</option>
                                                                    <option value="hold">HOLD</option>
                                                                    <option value="closure_advice">CLOSURE ADVICE</option>
                                                                    <option value="wip">WIP</option>
                                                                    <option value="completed">COMPLETED</option>
                                                                    <option value="stopcheck">STOPCHECK</option>
                                                                </select>
                                                            </>
                                                        )}

                                                        <div className="flex w-3/12  items-center gap-5">
                                                            <input
                                                                type="file"
                                                                name={formJson.db_table}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                multiple
                                                                onChange={(e) =>
                                                                    handleFileChange(index, dbTable, formJson.db_table, e)
                                                                }
                                                            />
                                                        </div>


                                                        {isModalOpen && (
                                                            <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center z-50">
                                                                <div className="bg-white rounded-lg p-6 w-[80%] max-w-[700px]">
                                                                    <div className="flex justify-between items-center mb-4">
                                                                        <h2 className="text-xl font-bold">
                                                                            {modalType === "selected"
                                                                                ? "Selected Images"
                                                                                : "Preselected Images"}
                                                                        </h2>
                                                                        <button
                                                                            onClick={closeModal}
                                                                            className="text-red-500 text-lg font-bold"
                                                                        >
                                                                            X
                                                                        </button>
                                                                    </div>

                                                                    {/* Render Selected Images */}
                                                                    {modalType === "selected" && files[dbTable]?.selectedFiles?.length > 0 && (
                                                                        <Swiper
                                                                            onSwiper={(swiper) => setThumbsSwiper(swiper)}
                                                                            spaceBetween={10}
                                                                            slidesPerView={4}
                                                                            freeMode
                                                                            watchSlidesProgress
                                                                            modules={[Thumbs]}
                                                                            className="thumbsSwiper"
                                                                        >
                                                                            {/* Render images here */}
                                                                        </Swiper>
                                                                    )}

                                                                    {/* Render Preselected Images */}
                                                                    {modalType === "preselected" && preselectedImage && (
                                                                        <Swiper
                                                                            spaceBetween={10}
                                                                            slidesPerView={4}
                                                                            freeMode
                                                                            watchSlidesProgress
                                                                            modules={[Thumbs]}
                                                                            className="thumbsSwiper"
                                                                        >
                                                                            {preselectedImage.split(",").map((imgPath, idx) => (
                                                                                <SwiperSlide key={idx}>
                                                                                    <img
                                                                                        src={`${imgPath}`}
                                                                                        alt={`Preselected ${idx + 1}`}
                                                                                        className="w-20 h-20 object-cover rounded-md"
                                                                                    />
                                                                                </SwiperSlide>
                                                                            ))}
                                                                        </Swiper>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {serviceImages.length > 0 && (
                                                        <div className="mt-4 mb-8 pb-12  border-b border-b-black  ">
                                                            <h3 className=" pb-2">{formJson.heading} IMAGES</h3>
                                                            <div className=" flex flex-wrap gap-2">
                                                                {serviceImages.map((imgPath, imgIndex) => (
                                                                    <img
                                                                        key={imgIndex}
                                                                        src={imgPath}
                                                                        alt={`Service Image ${imgIndex + 1}`}
                                                                        className="w-20 h-20 object-cover rounded-md"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>

                                            );
                                        }
                                        return null;
                                    })
                                ) : (
                                    <div className="text-center text-gray-500 mt-5">
                                        No services available
                                    </div>
                                )}


                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                onClick={handleSubmit}
                                className="p-6 py-3 bg-[#2c81ba] text-white font-bold  transition-all duration-300 ease-in-out transform hover:scale-105 rounded-md hover:bg-[#0f5381] transition duration-200 "
                            >
                                Submit
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamManagementGenerateReport;
