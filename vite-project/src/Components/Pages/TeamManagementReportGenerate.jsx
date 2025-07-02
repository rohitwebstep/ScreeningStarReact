import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs } from "swiper";
import { FaChevronLeft } from 'react-icons/fa';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import "swiper/css";

const TeamManagementGenerateReport = () => {
    const navigate = useNavigate();
    const [filesBulk, setFilesBulk] = useState([]);

    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [statusChanged, setStatusChanged] = useState({});
    const [filesUploaded, setFilesUploaded] = useState({});
    const [loading, setLoading] = useState(true);
    const [servicesDataInfo, setServicesDataInfo] = useState([]);
    const [serviceImagesState, setServiceImagesState] = useState([]);

    const [branchInfo, setBranchInfo] = useState({});
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [componentStatus, setComponentStatus] = useState(0); // Default to 0 (unchecked)
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


                setComponentStatus(result.CMTData?.component_status)
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

    useEffect(() => {
        if (servicesDataInfo) {
            const annexureMap = {};

            servicesDataInfo
                .filter(serviceData => serviceData?.serviceStatus)
                .forEach(serviceData => {
                    const serviceName = serviceData?.heading; // or serviceData?.serviceName, adjust if needed
                    const images = serviceData?.annexureData?.team_management_docs?.split(",") || [];

                    const validImages = images.filter(Boolean).map(img => img.trim());

                    if (validImages.length) {
                        annexureMap[serviceName] = [
                            {
                                "Annexure:": validImages.join(", "),
                            },
                        ];
                    }
                });

            console.log("Formatted Annexure Map:", annexureMap);
            setServiceImagesState(annexureMap); // Update your state with this formatted data
        }
    }, [servicesDataInfo]);





    const handleStatusChange = (e, dbTable, index) => {
        const updatedStatuses = [...selectedStatuses];
        updatedStatuses[index] = e.target.value;

        setSelectedStatuses(updatedStatuses);

        // Track that this index has changed status
        setStatusChanged((prev) => ({
            ...prev,
            [index]: true,
        }));
    };


    const handleFileChange = (index, dbTable, heading, e) => {
        const selectedFiles = Array.from(e.target.files);
        const updatedStatuses = [...selectedStatuses];
        updatedStatuses[index] = e.target.value;

        setSelectedStatuses(updatedStatuses);

        // Track that this index has changed status
        setStatusChanged((prev) => ({
            ...prev,
            [index]: true,
        }));
        setFiles((prevFiles) => ({
            ...prevFiles,
            [dbTable]: { selectedFiles, fileName: heading },
        }));

        // Mark that a file has been uploaded for this index
        setFilesUploaded((prev) => ({
            ...prev,
            [index]: selectedFiles.length > 0,
        }));
    };


    const uploadCustomerLogo = async () => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            console.error("Admin ID or token not found in local storage.");
            return false;
        }

        const uploadPromises = [];

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

            const uploadPromise = axios.post(
                "https://api.screeningstar.co.in/team-management/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            )
                .then((response) => {
                    const data = response.data;
                    if (data.token || data._token) {
                        localStorage.setItem("_token", data.token || data._token);
                    }
                })
                .catch((err) => {
                    console.error("Error uploading file:", err.message || err);
                    throw err; // Ensures Promise.all fails if any upload fails
                });

            uploadPromises.push(uploadPromise);
        }

        try {
            await Promise.all(uploadPromises);
            return true; // All uploads succeeded
        } catch (err) {
            return false; // At least one upload failed
        }
    };

    const formatServiceName = (dbTable) => {
        if (!dbTable) return "";
        return dbTable
            .replace(/_/g, " ")  // Replace underscores with spaces
            .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize each word
    }; const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        const fileCount = Object.keys(files).length;
        const isFileUploading = fileCount > 0;

        // Ensure files are uploaded if status is changed
        for (let index = 0; index < selectedStatuses.length; index++) {
            const TeamDocs = servicesDataInfo[index]?.annexureData?.team_management_docs;

            // Check if TeamDocs is a non-empty string after trimming
            if (typeof TeamDocs === 'string' && TeamDocs.trim().length > 0) {
                continue; // TeamDocs exists, skip to next
            } 
            
            // if (statusChanged[index] && !filesUploaded[index]) {
            //     const dbTable = servicesDataInfo[index]?.reportFormJson?.json
            //         ? JSON.parse(servicesDataInfo[index].reportFormJson.json).db_table
            //         : "";
            //     const serviceName = dbTable ? formatServiceName(dbTable) : `Row ${index + 1}`;

            //     console.log('team_management_docs---', TeamDocs);
            //     Swal.fire("Error", `Please upload a file for "${serviceName}" before submission.`, "error");
            //     setLoading(false);
            //     return;
            // }           
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
                component_status: componentStatus,
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
            const newToken = response.token || response._token || localStorage.getItem("_token");

            if (newToken) {
                console.log("Saving token:", newToken);
                localStorage.setItem("_token", newToken);
            }
            if (!response.ok) throw new Error("Failed to submit data");

            const branchidFromUrl = new URLSearchParams(window.location.search).get('branchid');
            const clientIdFromUrl = new URLSearchParams(window.location.search).get('clientId');

            // Wait for all images to be uploaded before proceeding
            const uploadSuccess = await uploadCustomerLogo();
            if (!uploadSuccess) {
                Swal.fire("Error", "Failed to upload files. Submission aborted.", "error");
                setLoading(false);
                return;
            }

            // Show success only after all images are uploaded
            Swal.fire("Success", "Service Status updated Successfully!", "success");

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

    const fetchImageToBase = async (imageUrls) => {
        try {
            const response = await axios.post(
                "https://api.screeningstar.co.in/utils/image-to-base",
                { image_urls: imageUrls },
                { headers: { "Content-Type": "application/json" } }
            );

            return Array.isArray(response.data.images) ? response.data.images : [];
        } catch (error) {

            console.error("Error fetching images:", error);
            return [];
        }
    };
    const handleDownloadFile = async (fileUrl, event) => {
        event.preventDefault(); // Prevent default anchor behavior

        if (!fileUrl) return;

        try {
            const response = await fetchImageToBase(fileUrl); // Ensure this function works correctly
            console.log(`response - `, response);
            console.log(`fileUrl - `, fileUrl);
            const imageData = response.find(img => decodeURIComponent(img.imageUrl.trim()) === decodeURIComponent(fileUrl.trim()));

            if (!imageData) {
                throw new Error("Image data not found");
            }

            const base64Data = imageData.base64.split(",")[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Uint8Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const blob = new Blob([byteNumbers], { type: `image/${imageData.type}` });
            const blobUrl = window.URL.createObjectURL(blob);

            const fileName = fileUrl.split("/").pop() || `image.${imageData.type}`;

            const anchor = document.createElement("a");
            anchor.href = blobUrl;
            anchor.download = fileName;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);

            // Cleanup
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error downloading file:", error);
            alert("Download failed! Try opening the image and saving it manually.");
        }
    };
    const handleDownloadDocuments = (fileUrl, fileType, e) => {
        e.preventDefault();

        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', '');
        link.setAttribute('target', '_blank'); // Ensures no redirection
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const fetchImageToBaseNew = async (urls) => {
        const results = await Promise.all(
            urls.map(async (url) => {
                const res = await fetch(url);
                const blob = await res.blob();

                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({ base64: reader.result });
                    };
                    reader.readAsDataURL(blob); // <-- THIS is the key
                });
            })
        );
        return results;
    };


    const FileViewer = ({ fileUrl }) => {
        if (!fileUrl) return <p>No file provided</p>;

        const getFileExtension = (url) => url.split('.').pop().toLowerCase();
        const fileExtension = getFileExtension(fileUrl);

        const handleDownloadFile = async (url, e) => {
            e.preventDefault();

            try {
                const response = await fetchImageToBaseNew([url]);
                const fileData = response?.[0];

                if (!fileData?.base64) {
                    console.error("No base64 data found.");
                    return;
                }

                let base64Content = fileData.base64;
                let mimeType = "application/octet-stream"; // Default for unknown files

                // Check if it includes the data URI prefix
                if (base64Content.startsWith("data:")) {
                    const parts = base64Content.split(",");
                    mimeType = parts[0].match(/data:(.*);base64/)[1];
                    base64Content = parts[1];
                }

                const extensionMap = {
                    "application/pdf": "pdf",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
                    "application/vnd.ms-excel": "xls",
                    "application/zip": "zip",
                    "application/msword": "doc",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
                    "image/png": "png",
                    "image/jpeg": "jpg",
                    "text/plain": "txt"
                };

                const extension = extensionMap[mimeType] || "";

                const blob = base64ToBlobNew(base64Content, mimeType);
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = blobUrl;

                const nameFromUrl = url.split("/").pop().split("?")[0];
                const defaultName = nameFromUrl.includes(".")
                    ? nameFromUrl
                    : `${nameFromUrl || "downloaded-file"}.${extension}`;

                link.download = defaultName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error("Error downloading file:", error);
            }
        };


        const handleDownloadViaProxy = async (originalUrl, e) => {
            e.preventDefault();

            try {
                const proxyUrl = `/proxy-download?url=${encodeURIComponent(originalUrl)}`;
                const res = await fetch(proxyUrl);

                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = originalUrl.split("/").pop() || "file";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error("Proxy download failed:", error);
            }
        };



        return (
            <tr className="text-center">
                <td className="border border-gray-300 px-4 py-2">
                    {['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'heif', 'heic', 'avif', 'ico', 'jfif', 'raw', 'psd', 'ai', 'eps'].includes(fileExtension) ? (
                        <img src={fileUrl} alt="Image File" className="w-20 h-20 object-cover rounded-md mx-auto" />
                    ) : fileExtension === 'pdf' ? (
                        <iframe src={fileUrl} title="PDF Viewer" className="w-40 h-20"></iframe>
                    ) : fileExtension === 'zip' ? (
                        <span>📦</span>
                    ) : (
                        <span>📄</span>
                    )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                    {fileUrl.split('/').pop()}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                    {['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'heif', 'heic', 'avif', 'ico', 'jfif', 'raw', 'psd', 'ai', 'eps'].includes(fileExtension) ? (
                        <button
                            className="px-3 py-2 bg-green-500 text-white rounded-md text-sm"
                            onClick={(e) => handleDownloadViaProxy(fileUrl, e)}
                        >
                            Download Image
                        </button>
                    ) : fileExtension === 'pdf' ? (
                        <button
                            className="px-3 py-2 bg-red-500 text-white rounded-md text-sm"
                            onClick={(e) => handleDownloadViaProxy(fileUrl, e)}
                        >
                            Download PDF
                        </button>
                    ) : ['doc', 'docx', 'xls', 'xlsx'].includes(fileExtension) ? (
                        <button
                            className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm"
                            onClick={(e) => handleDownloadViaProxy(fileUrl, e)}
                        >
                            Open Document
                        </button>
                    ) : fileExtension === 'zip' ? (
                        <button
                            className="px-3 py-2 bg-yellow-500 text-white rounded-md text-sm"
                            onClick={(e) => handleDownloadViaProxy(fileUrl, e)}
                        >
                            Download ZIP
                        </button>
                    ) : (
                        <span className="text-red-500">Unsupported file type</span>
                    )}
                </td>
            </tr>
        );
    };
    // const filesBulks = () => {
    //     // Simulating a function that generates URLs
    //     const newUrl = filesBulk; 

    //     // Add to state only if it's not already present
    //     setFilesBulk((prevUrls) => {
    //       if (!prevUrls.includes(newUrl)) {
    //         return [...prevUrls, newUrl];
    //       }
    //       return prevUrls;
    //     });
    //   };
    const downloadAllImages = async (imageUrls) => {
        const zip = new JSZip();
        const folder = zip.folder("service-images");

        // Fetch all images and add to zip
        const fetchPromises = imageUrls.map(async (url, index) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                folder.file(`image_${index + 1}.jpg`, blob);
            } catch (error) {
                console.error(`Failed to fetch image ${url}`, error);
            }
        });

        // Wait for all images to be added
        await Promise.all(fetchPromises);

        // Generate and download ZIP
        zip.generateAsync({ type: "blob" }).then((zipBlob) => {
            saveAs(zipBlob, "service-images.zip");
        });
    };

    const base64ToBlob = (base64) => {
        try {
            // Convert Base64 string to binary
            const byteCharacters = atob(base64);
            const byteNumbers = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            return new Blob([byteNumbers], { type: "image/png" });
        } catch (error) {
            console.error("Error converting base64 to blob:", error);
            return null;
        }
    };
    const base64ToBlobNew = (base64, mimeType) => {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i += 512) {
            const slice = byteCharacters.slice(i, i + 512);
            const byteNumbers = new Array(slice.length);
            for (let j = 0; j < slice.length; j++) {
                byteNumbers[j] = slice.charCodeAt(j);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        return new Blob(byteArrays, { type: mimeType });
    };

    const handleDownloadAllFiles = async (attachments) => {
        const zip = new JSZip();
        let allUrls = [];

        try {
            // Step 1: Collect all image URLs
            for (const [category, files] of Object.entries(attachments)) {
                for (const attachment of files) {
                    const label = Object.keys(attachment)[0];
                    const fileUrls = attachment[label]?.split(",").map(url => url.trim());

                    if (fileUrls && fileUrls.length > 0) {
                        allUrls.push({ category, label, urls: fileUrls });
                    }
                }
            }

            if (allUrls.length === 0) {
                console.warn("No valid image URLs found.");
                return;
            }

            // Step 2: Fetch Base64 for all image URLs
            const allImageUrls = allUrls.flatMap(item => item.urls);
            const base64Response = await fetchImageToBase(allImageUrls);
            const base64Images = base64Response || [];

            if (base64Images.length === 0) {
                console.error("No images received from API.");
                return;
            }

            // Step 3: Add each image to ZIP
            let imageIndex = 0;
            for (const { category, label, urls } of allUrls) {
                for (const url of urls) {
                    const imageData = base64Images.find(img => img.imageUrl === url);

                    if (imageData && imageData.base64.startsWith("data:image")) {
                        const base64Data = imageData.base64.split(",")[1];
                        const blob = base64ToBlob(base64Data, imageData.type);

                        if (blob) {
                            const fileName = `${category}/${label}/image_${imageIndex + 1}.${imageData.type}`;
                            zip.file(fileName, blob);
                        }
                    } else {
                        console.warn(`Skipping invalid Base64 data for URL: ${url}`);
                    }
                    imageIndex++;
                }
            }

            // Step 4: Generate and trigger ZIP download
            const zipContent = await zip.generateAsync({ type: "blob" });
            saveAs(zipContent, "attachments.zip");
            console.log("✅ ZIP file downloaded successfully!");

        } catch (error) {
            console.error("❌ Error generating ZIP:", error);
        }
    };

    console.log('serviceImagesState', serviceImagesState)
    return (
        <div className="bg-[#c1dff2] border border-black">
            <h2 className="text-2xl font-bold py-3 text-left text-[#4d606b] px-3 border">
                GENERATE REPORT
            </h2>
            <div className="bg-white md:p-12 p-0 w-full border-t border-black mx-auto">

                <div
                    onClick={handleGoBack}
                    className="flex items-center m-4 w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl  text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <div className=" md:p-12 p-6">
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
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDownloadAllFiles(serviceImagesState);
                                    }}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                                >
                                    Download All
                                </button>
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

                                                    <div key={index} className="mb-6 md:flex items-center  justify-between mt-5">
                                                        {formJson.heading && (
                                                            <>
                                                                <span className="md:w-3/12 w-full mb-2 font-semibold">{formJson.heading}</span>
                                                                <select
                                                                    className="border mb-2 p-2 md:w-4/12  w-full rounded-md"
                                                                    value={preselectedStatus}
                                                                    onChange={(e) => handleStatusChange(e, dbTable, index)}
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
                                                            </>
                                                        )}

                                                        <div className="flex md:w-3/12 w-full mb-2 items-center gap-5">


                                                            <input
                                                                type="file"
                                                                multiple
                                                                name={formJson.db_table}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                                <table className="w-full border-collapse border border-gray-300 mt-4">
                                                                    <thead>
                                                                        <tr className="bg-gray-200">
                                                                            <th className="border border-gray-300 px-4 py-2">Preview</th>
                                                                            <th className="border border-gray-300 px-4 py-2">File Name</th>
                                                                            <th className="border border-gray-300 px-4 py-2">Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {serviceImages.map((imgPath, imgIndex) => (
                                                                            <FileViewer key={imgIndex} fileUrl={imgPath} className=" w-20 h-20 object-cover rounded-md" />
                                                                        ))}
                                                                    </tbody>
                                                                </table>
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

                                <div className="mb-4">
                                    <label className="capitalize text-gray-500" htmlFor="component_status">
                                        TEAM MANAGEMENT
                                        <span className="text-red-500 text-xl">*</span>
                                    </label>
                                    <div className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            name="component_status"
                                            id="component_status"
                                            checked={componentStatus === 1}
                                            onChange={(e) => setComponentStatus(e.target.checked ? 1 : 0)}
                                            className="w-5 h-5 border rounded-md mr-2"
                                        />

                                        <label htmlFor="component_status" className="text-gray-700">
                                            Yes / No
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                onClick={handleSubmit}
                                className="p-6 py-3 bg-[#2c81ba] text-white font-bold  transition-all duration-300 ease-in-out transform hover:scale-105 rounded-md hover:bg-[#0f5381] "
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
