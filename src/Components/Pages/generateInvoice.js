import { React, useEffect, useState, useCallback } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { State } from "country-state-city";

import SelectSearch from "react-select-search";
import "react-select-search/style.css";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from '../ApiLoadingContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
const GenerateInvoice = () => {
  const [activeList, setActiveList] = useState([]);
  const [clientCode, setClientCode] = useState("");
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

  const states = State.getStatesOfCountry("IN"); // Gets all Indian states

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [overAllAmountWithTax, setoverAllAmountWithTax] = useState("");
  const [taxableValue, setTaxableValue] = useState("");
  const [totalGst, setTotalGst] = useState("");
  const [serviceInfo, setServiceInfo] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applicationData, setApplicationData] = useState([]);
  const [overallServiceAmount, setOverallServiceAmount] = useState([]);
  const [cgst, setCgst] = useState([]);
  const getStateNameFromCode = (code) => {
    const state = states.find((st) => st.isoCode === code.toUpperCase());
    return state ? state.name : "N/A";
  };

  const [sgst, setSgst] = useState([]);
  const [totalTax, setTotalTax] = useState([]);
  const [totalAmount, setTotalAmount] = useState([]);
  const [servicesData, setServicesData] = useState([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    client_code: '',
    invoice_number: "",
    invoice_date: "",
    month: "",
    year: "",
  });
  useEffect(() => {
    try {
      if (customer && customer.services) {
        // Parse the `services` string safely
        const parsedServices = JSON.parse(customer.services);

        // Extract service data
        const extractedServices = parsedServices.flatMap((group) =>
          group.services.map(
            ({ serviceId, serviceTitle, serviceCode, price }) => ({
              serviceId,
              serviceTitle,
              serviceCode,
              price,
            })
          )
        );

        // Update state with the extracted data
        setServicesData(extractedServices);
      }
    } catch (error) {
      console.error("Error parsing customer services:", error.message);
    }
  }, [customer.services]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    // Clear the error message for the specific field as soon as the user types
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '',
    }));
  };




  const options = activeList.map((client) => ({
    name: client.name + `(${client.client_unique_id})`,
    value: client.id,
  }));

  const fetchActiveAccounts = useCallback(async () => {
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");
    setApiLoading(true);
    if (!admin_id || !storedToken) {
      setApiLoading(false);
      console.error("Admin ID or token not found. Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/customer/list-with-basic-info?admin_id=${admin_id}&_token=${storedToken}`,
        {
          method: "GET",
          redirect: "follow",
        }
      );

      if (!response.ok) {
        setApiLoading(false);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      setApiLoading(false);

      const result = await response.json();
      const newToken = result.token || result._token || storedToken;
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }
      setActiveList(result.customers);
    } catch (error) {
      setApiLoading(false);

      console.error("Failed to fetch active accounts:", error);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoading == false) {
          await validateAdminLogin(); // Verify admin first
          await fetchActiveAccounts();
        }// Fetch data after verification
      } catch (error) {
        console.error(error.message);
        navigate("/admin-login"); // Redirect if validation fails
      }
    };

    initialize(); // Execute the sequence
  }, [navigate, fetchActiveAccounts]);
  function addFooter(doc) {
    const totalPages = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i); // Go to each page

      // Clear previous footer space (optional: if overlapping still happens)
      // doc.setFillColor(255, 255, 255); // white
      // doc.rect(0, pageHeight - 15, pageWidth, 15, "F");

      // Set font for footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);

      // Footer text
      const footerText = `Page ${i} of ${totalPages}`;

      // Print centered footer at the bottom
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
    }
  }



  const fetchPdfData = useCallback(async (overAllCgstTaxs, overAllSgstTaxs, overAllIGSTTaxs, totalGsts, totalAmounts, taxableValuess, overAllAmountWithTaxs, companynames, customer) => {
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!storedToken) {
      console.error("No token found. Please log in.");
      return;
    }

    // Ensure formData and customer are properly defined before using them
    const { month, year, invoice_date, invoice_number } = formData || {};
    const { gst_number, state, state_code } = customer || {};

    const raw = JSON.stringify({
      admin_id,
      _token: storedToken,
      customer_id: formData.client_code,
      month: month,
      year: year,
      orgenization_name: companynames,
      gst_number: customer.gst_number,
      state: customer.state,
      state_code: customer.state_code,
      invoice_date: formData.invoice_date,
      invoice_number: formData.invoice_number,
      taxable_value: taxableValuess,
      cgst: overAllCgstTaxs,
      sgst: overAllSgstTaxs,
      igst: overAllIGSTTaxs,
      total_gst: totalGsts,
      invoice_subtotal: totalAmounts
    });

    try {
      const response = await axios.post(
        `https://api.screeningstar.co.in/invoice-master/send-data`,
        raw,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`,
          }
        }
      );

      const result = response.data;
      const newToken = result.token || result._token || storedToken;

      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      if (result.status) {
        // handle success here
        console.log("Data successfully sent");
      } else {
        console.error("Failed to fetch packages. Status:", result.status);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      // Ensure loading is set to false in the finally block (if you have a loading state)
      // Example: setLoading(false);
    }
  }, [formData, customer, companyName, taxableValue, totalGst,]);







  const handleSubmit = async (e) => {
    e.preventDefault();
    // Set loading state to true
    setLoading(true);
    // Validate form data
    const validationErrors = {};
    if (!formData.client_code) validationErrors.client_code = 'Client Code is required';
    if (!formData.invoice_number) validationErrors.invoice_number = 'Invoice Number is required';
    if (!formData.invoice_date) validationErrors.invoice_date = 'Invoice Date is required';
    if (!formData.month) validationErrors.month = 'Month is required';
    if (!formData.year) validationErrors.year = 'Year is required';

    // If there are validation errors, update the error state and stop further processing
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    // Extract data for API request
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");
    const { month, year } = formData;
    const customer_id = formData.client_code;

    console.log("Admin ID:", admin_id);
    console.log("Stored Token:", storedToken);
    console.log("Customer ID:", customer_id);
    console.log("Month:", month);
    console.log("Year:", year);

    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    try {
      console.log("Sending fetch request...");
      const response = await fetch(
        `https://api.screeningstar.co.in/generate-invoice?customer_id=${customer_id}&admin_id=${admin_id}&_token=${storedToken}&month=${month}&year=${year}`,
        requestOptions
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      console.log("Response data:", data);

      // Update the token if available
      const newToken = data.token || data._token || storedToken;
      if (newToken) {
        console.log("New token received:", newToken);
        localStorage.setItem("_token", newToken);
      }
      // setClientCode(formData.client_code);

      // Update state with response data
      setServiceInfo(data.finalArr.serviceInfo);
      setOverallServiceAmount(data.finalArr.costInfo.overallServiceAmount);
      setCgst(data.finalArr.costInfo.cgst);
      setSgst(data.finalArr.costInfo.sgst);
      setTotalTax(data.finalArr.costInfo.totalTax);
      setTotalAmount(data.finalArr.costInfo.totalAmount);
      setCustomer(data.customer || []);
      setApplications(data.applications);

      /*
      setFormData({
        client_code: '',
        invoice_number: "",
        invoice_date: "",
        month: "",
        year: "",
      });
      */

      if (applications.length > 0) {
        Swal.fire({
          icon: "success",
          title: "Invoice Generated Successfully",
          text: "Your invoice data is ready. Proceeding to generate the PDF...",
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        // Success alert when there are no applications
        Swal.fire({
          icon: "success",
          title: "Success",
          text: " But You don't have any applications to process.",
          timer: 3000,
          timerProgressBar: true,
        });
      }


      // Proceed with PDF generation if the data is ready
      if (data.status) {
        console.log("PDF available, generating...");
        await generatePdf(
          data.serviceNames,
          data.finalArr.serviceInfo,
          data.finalArr.costInfo.overallServiceAmount,
          data.finalArr.costInfo.cgst,
          data.finalArr.costInfo.sgst,
          data.finalArr.costInfo.totalTax,
          data.customer || [],
          data.applications,
          data.finalArr.costInfo.totalAmount,
          data.companyInfo
        );
      } else {
        Swal.fire({
          icon: "warning",
          title: "PDF Not Available",
          text: "Unable to generate the PDF. Please try again later.",
        });
      }
    } catch (error) {
      // Error alert
      // Swal.fire({
      //   icon: "error",
      //   title: "Error",
      //   text: `An error occurred: ${error.message}`,
      // });
      console.error("Fetch error:", error);
    } finally {
      // Turn off loading state
      setLoading(false);
    }
  };

  function numberToWords(num) {
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
      'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
      'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(n) {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
    }

    const [whole, decimal] = num.toFixed(2).split('.');
    let words = inWords(Number(whole)) + ' Rupees';
    if (Number(decimal) > 0) {
      words += ' and ' + inWords(Number(decimal)) + ' Paise';
    }
    return words + ' Only';
  }

  const generatePdf = (serviceNames, serviceInfo, overallServiceAmount, cgst, sgst, totalTax, customer, applications, totalAmounts, companyInfo) => {
    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const leftMargin = 10;
    const topMargin = 10;
    const padding = 5; // Padding between content and borders
    const columnHeight = 50;
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      if (isNaN(date)) return "Invalid Date";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    };

    // Define column widths (Ensure total = pageWidth - margins)
    const firstColumnWidth = (pageWidth - 2 * leftMargin) * 0.25; // 25% of available width
    const secondColumnWidth = (pageWidth - 2 * leftMargin) * 0.50; // 50% of available width
    const thirdColumnWidth = (pageWidth - 2 * leftMargin) * 0.25; // 25% of available width

    const logoBase64 = "data:image/png;base64,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";
    doc.rect(leftMargin, topMargin, firstColumnWidth, columnHeight); // Add border around first column
    doc.addImage(
      logoBase64,
      "PNG",
      leftMargin + padding,
      topMargin + padding,
      60, // Set width to 60px
      20  // Set height to 60px
    );

    // Second column (Company Details)
    const secondColumnX = leftMargin + firstColumnWidth;
    doc.rect(secondColumnX, topMargin, secondColumnWidth, columnHeight); // Add border around second column

    const textX = secondColumnX + secondColumnWidth / 2; // Center the text horizontally in the column
    const textY = topMargin + 8.5; // Start position for the text

    const companyName = companyInfo?.name || 'N/A';
    setCompanyName(companyName);
    const companynames = companyName;

    // if (companyInfo?.address) {
    //   addressLines = companyInfo.address.split(",");
    // }
    const addressLines = [
      "No-19/4 & 27",
      " IndiQube Alpha",
      " ",
      " 1st Floor B4",
      " Outer Ring Road Kadubeesanahalli",
      "Panathur Junction",
      " Bangalore",
      " Pin code – 560103",
      " Karnataka",
      " India"
    ];

    let formattedLine1 = "";
    let formattedLine2 = "";
    let formattedLine3 = "";

    // Loop through the address array
    for (let i = 0; i < addressLines.length; i++) {
      if (i <= 2) {
        // Combine first three parts into one line
        if (formattedLine1) {
          formattedLine1 += `, ${addressLines[i].trim()}`;
        } else {
          formattedLine1 = addressLines[i].trim();
        }
      } else if (i >= 3 && i <= 5) {
        // Next few for line 2
        if (formattedLine2) {
          formattedLine2 += `, ${addressLines[i].trim()}`;
        } else {
          formattedLine2 = addressLines[i].trim();
        }
      } else {
        // Remaining for line 3 (e.g., pincode etc.)
        if (formattedLine3) {
          formattedLine3 += `, ${addressLines[i].trim()}`;
        } else {
          formattedLine3 = addressLines[i].trim();
        }
      }
    }



    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('SCREENINGSTAR SOLUTIONS PRIVATE LIMITED', textX, textY, { align: "center" });
    // addFooter(doc); // Add footer for this page

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    // Check and add formatted lines if they are not empty
    if (formattedLine1) {
      const textWidth = doc.getTextWidth(formattedLine1);
      doc.text(formattedLine1, textX, textY + 5, { align: "center", maxWidth: secondColumnWidth - 2 });
    }
    if (formattedLine2) {
      doc.text(formattedLine2, textX, textY + 10, { align: "center" });
    }
    if (formattedLine3) {
      doc.text(formattedLine3, textX, textY + 15, { align: "center" });
    }

    // Check and add company info if it's available
    if (companyInfo?.phone_number && companyInfo?.email) {
      doc.text(
        `PH: 9980004953 | Email: ${companyInfo.email}`,
        textX,
        textY + 20,
        { align: "center" }
      );
    }
    if (companyInfo?.website) {
      doc.text(`Web: www.screeningstar.com`, textX, textY + 25, { align: "center" });
    }

    // Check and add tax information if available
    if (companyInfo?.pan && companyInfo?.gstin) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(
        `PAN: ${companyInfo.pan}, GSTIN: ${companyInfo.gstin}`,
        textX,
        textY + 30,
        { align: "center" }
      );
    }

    if (companyInfo?.udhyam_number) {
      doc.text(
        `Udhyam Aadhar Number: ${companyInfo.udhyam_number}`,
        textX,
        textY + 35,
        { align: "center" }
      );
    }


    // Third column (QR Code)
    const thirdColumnX = secondColumnX + secondColumnWidth; // Correct position for third column
    const qrCodeBase64 =
      "https://webstepdev.com/screeningstarAssets/screeningstarqr-9654317.png"; // Replace with your base64-encoded image or a URL
    doc.rect(thirdColumnX, topMargin, thirdColumnWidth, columnHeight); // Add border around third column

    // Set image size to 60px by 60px
    doc.addImage(
      qrCodeBase64,
      "PNG",
      thirdColumnX + (thirdColumnWidth - 35) / 2, // Center the QR code horizontally
      topMargin + (columnHeight - 35) / 2, // Center the QR code vertically
      35, // Set width to 60px
      35  // Set height to 60px
    );

    // Add "TAX INVOICE" text
    const taxInvoiceHeight = 6; // Background height
    const taxInvoiceY = topMargin + columnHeight + 5; // Position below the columns

    // Draw background rectangle
    doc.setFillColor(193, 223, 242);
    doc.setDrawColor(0); // Black border (grayscale)

    doc.rect(leftMargin, taxInvoiceY, pageWidth - 2 * leftMargin, taxInvoiceHeight, "FD");

    // Add centered "TAX INVOICE" text
    const taxInvoiceX = pageWidth / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setDrawColor(0); // Black border (grayscale)

    doc.setTextColor(77, 96, 107); // Equivalent to #4d606b
    doc.text("TAX INVOICE", taxInvoiceX, taxInvoiceY + taxInvoiceHeight / 2 + 1, { align: "center" });
    const rowHeight = 6; // Height of the new row
    const rowY = taxInvoiceY + taxInvoiceHeight - 5; // Position below the "TAX INVOICE" background

    const columnWidth = (pageWidth - 2 * leftMargin) / 2; // 50% width
    const column1X = leftMargin; // Left column start
    const column2X = leftMargin + columnWidth; // Right column start

    // Column 1 (Invoice Details)

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0); // Black text
    // Column 2 (Details of Service Recipient)
    // Add second row (for "Bill To", "Attention", etc.)
    const rowHeightNext = 35; // Height of the new row
    const rowYNext = rowY + rowHeight + 5; // Position below the first row

    const column1XNext = leftMargin; // Left column start
    const column2XNext = leftMargin + columnWidth; // Right column start

    // Column 1 (Bill To and Attention)
    doc.rect(column1XNext, rowYNext, columnWidth, rowHeightNext); // Add border
    doc.setFont("helvetica", "normal");

    // Labels and Values in the first column (Bill To and Attention)

    let labelY = rowYNext + padding; // Start Y position for labels in the first column

    // --- Bill To ---
    const orgName = customer.name || "N/A";
    const address = customer.address || "N/A";

    // Set font for the label and content
    doc.setFont("helvetica", "normal");

    // Print "To," on the first line
    doc.text("To,", column1XNext + padding, labelY);

    // Move to next line for company name
    labelY += 7;
    doc.text(orgName, column1XNext + padding, labelY);

    // Move to next line for address, with wrapping if needed
    labelY += 7;
    const wrappedAddress = doc.splitTextToSize(`${address}`, columnWidth - 7);
    doc.text(wrappedAddress, column1XNext + padding, labelY);

    // Update Y position after the address
    labelY += wrappedAddress.length * 7;

    doc.setFont("helvetica", "normal");

    doc.rect(column2XNext, rowYNext, columnWidth, rowHeightNext); // Add border

    // Labels and Values in the second column (Client GST NO, Invoice Number, etc.)
    let labelYSecondColumn = rowYNext + padding; // Start Y position for labels in the second column
    doc.text("GSTIN", column2XNext + padding, labelYSecondColumn); // Client GST NO label
    doc.text(customer.gst_number || "Not Registered", column2XNext + 40, labelYSecondColumn); // Value for Client GST NO
    labelYSecondColumn += 7; // Move to next row with 5px gap

    doc.text("Invoice Number", column2XNext + padding, labelYSecondColumn); // Invoice Number label
    doc.text(formData.invoice_number, column2XNext + 40, labelYSecondColumn); // Value for Invoice Number
    labelYSecondColumn += 7; // Move to next row with 5px gap

    doc.text("State", column2XNext + padding, labelYSecondColumn); // State label
    doc.text(getStateNameFromCode(customer.state) || "N/A", column2XNext + 40, labelYSecondColumn); // Value for State
    labelYSecondColumn += 7; // Move to next row with 5px gap
    const formattedDateInvoice = formatDate(formData.invoice_date);

    doc.text("Date Of Invoice", column2XNext + padding, labelYSecondColumn); // Date Of Service label
    doc.text(formattedDateInvoice, column2XNext + 40, labelYSecondColumn); // Value for Date Of Service
    labelYSecondColumn += 7; // Move to next row with 5px gap

    doc.text("State Code", column2XNext + padding, labelYSecondColumn); // State Code label
    doc.text(customer.state_code || "N/A", column2XNext + 40, labelYSecondColumn); // Value for State Code
    // Calculate Y position for the table, just below the second column's labels
    const tableStartY = labelYSecondColumn + 10; // Adjust as needed for spacing

    const serviceCodes = serviceInfo.map((service) => {
      const matchedService = serviceNames.find(
        (some) => Number(some.id) === Number(service.serviceId)
      );
      return matchedService ? matchedService.shortCode : null;
    });

    let totalSubPrice = 0;

    const overAllCgstPercentage = parseInt(cgst.percentage, 10);
    const overAllSgstPercentage = parseInt(sgst.percentage, 10);
    const overAllTotalTaxPercentage = overAllCgstPercentage + overAllSgstPercentage;

    // Dynamic Table Rows for Annexure
    let overallApplicationsAdditionalFeeSum = 0;
    let overallApplicationsServicePricesSum = 0;
    let overallApplicationsTotalPricing = 0;
    let overallApplicationsTotalTax = 0;
    let overallApplicationsTotalPriceWithTax = 0;
    let overallServicePricingByService = [];
    let result;
    const tableBody2 = applications.flatMap((applicationArr) => {
      return applicationArr.applications.map((app) => {
        const servicePrices = serviceInfo.map((service) => {
          const matchedService = app.statusDetails.find(
            (status) => Number(status.serviceId) === Number(service.serviceId)
          );
          if (matchedService) {
            const existingService = overallServicePricingByService.find(
              (item) => item.id === service.serviceId
            );

            if (existingService) {
              existingService.totalPrice += service.price || 0;
              existingService.price = service.price || 0;
              existingService.qty += 1;
            } else {
              overallServicePricingByService.push({
                id: service.serviceId,
                totalPrice: service.price || 0,
                price: service.price || 0,
                qty: 1,
                totalAddFee: 0,
              });
            }

            return (service.price || 0).toFixed(2); // Format service price to 2 decimal places
          }

          return "0.00"; // Ensure the return value is formatted
        });

        const serviceAdditionalFee = serviceInfo.map((service) => {
          const matchedService = app.statusDetails.find(
            (status) => Number(status.serviceId) === Number(service.serviceId)
          );

          if (matchedService) {
            const existingService = overallServicePricingByService.find(
              (item) => item.id === service.serviceId
            );

            const additionalFeeValue = Number(matchedService.additionalFee);
            const validAdditionalFee = isNaN(additionalFeeValue)
              ? 0
              : additionalFeeValue;

            if (existingService) {
              existingService.totalAddFee += validAdditionalFee || 0;
            } else {
              overallServicePricingByService.push({
                id: service.serviceId,
                totalPrice: 0,
                totalAddFee: validAdditionalFee || 0,
                price: service.price || 0,
                qty: 1,
              });
            }

            return (validAdditionalFee || 0).toFixed(2);
          }
          return "NIL";
        });
        // Function to format the date to "Month Day, Year" format
        const formatDate = (date) => {
          if (!date) return "NOT APPLICABLE"; // Check for null, undefined, or empty
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) return "Nill"; // Check for invalid date
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          return `${day}-${month}-${year}`;
        };

        const additionalFeeSum = serviceAdditionalFee
          .filter((item) => !isNaN(item))
          .reduce((acc, curr) => acc + parseFloat(curr), 0)
          .toFixed(2);

        const servicePricesSum = servicePrices
          .filter((item) => !isNaN(item))
          .reduce((acc, curr) => acc + parseFloat(curr), 0)
          .toFixed(2);

        const appTotalPricing = (
          parseFloat(additionalFeeSum) + parseFloat(servicePricesSum)
        ).toFixed(2); // Format total pricing to 2 decimal places
        const appTotalTax = (
          parseFloat(appTotalPricing) * (overAllTotalTaxPercentage / 100)
        ).toFixed(2);

        overallApplicationsAdditionalFeeSum += parseFloat(additionalFeeSum);
        overallApplicationsServicePricesSum += parseFloat(servicePricesSum);
        overallApplicationsTotalPricing += parseFloat(appTotalPricing);
        overallApplicationsTotalTax += parseFloat(appTotalTax);

        overallApplicationsTotalPriceWithTax +=
          parseFloat(appTotalPricing) + parseFloat(appTotalTax);

        // Create an object dynamically for each service code with corresponding service price
        const servicePriceDetails = serviceCodes.reduce((acc, code, index) => {
          acc[`serviceCode${code}`] = servicePrices[index] || "0.00"; // Default to "0.00" if price is missing
          return acc;
        }, {});

        result = {
          serviceDescription: app.application_id || "NIL",
          hsnCode: app.employee_id || "NIL",
          ...(clientCode === 'SS-OROC' ? {
            check_id: app.check_id,
            ticket_id: app.ticket_id
          } : {}),
          qty: formatDate(app.created_at) || "NIL",
          rate: app.name || "NIL",
          ...Object.fromEntries(Object.entries(servicePriceDetails).map(([key, val]) => [
            key,
            parseFloat(val) % 1 === 0 ? parseInt(val).toString() : parseFloat(val).toString()
          ])),
          additionalFee: parseFloat(additionalFeeSum) % 1 === 0
            ? parseInt(additionalFeeSum).toString()
            : parseFloat(additionalFeeSum).toString(),
          taxableAmount: parseFloat(appTotalPricing) % 1 === 0
            ? parseInt(appTotalPricing).toString()
            : parseFloat(appTotalPricing).toString(),
          reportDate: formatDate(app.report_date) || "Nil",
        };
        return result;

      });
    });
    const taxableValuess = result.taxableAmount;

    let totalServiceQty = 0;

    const formatAmount = (value) => {
      const num = parseFloat(value);
      return num % 1 === 0 ? String(parseInt(num)) : num.toFixed(2);
    };
    const serviceTableBody = overallServicePricingByService.map((item) => {
      const serviceName = serviceNames.find((name) => name.id === item.id);
      const hsnCode = serviceName ? serviceName.hsnCode : "N/A";
      const title = serviceName ? serviceName.title : "N/A";

      // const price = formatAmount(item.price);
      const price = parseFloat(item.price);
      const totalPrice = parseFloat(item.totalPrice);
      const totalAddFee = parseFloat(item.totalAddFee);
      const formattedTaxableAmount = formatAmount(parseFloat(item.totalPrice) + parseFloat(item.totalAddFee));

      totalServiceQty += item.qty;
      totalSubPrice += price;

      return {
        serviceDescription: title,
        hsnCode: hsnCode,
        qty: item.qty || 0,
        rate: price,
        additionalFee: totalAddFee,
        taxableAmount: formattedTaxableAmount,
      };
    });


    const overallApplicationsTotalPricingWithAdditionalFee = overallApplicationsTotalPricing + overallApplicationsAdditionalFeeSum;

    // ✅ Add Sub Total Row after the map
    serviceTableBody.push({
      serviceDescription: "Sub Total",
      hsnCode: "",
      qty: "", // String(totalServiceQty)
      rate: "", // formatAmount(totalSubPrice)
      additionalFee: formatAmount(overallApplicationsAdditionalFeeSum),
      taxableAmount: formatAmount(overallApplicationsTotalPricing),
    });


    const columns = [
      { header: 'SERVICE DESCRIPTION', dataKey: 'serviceDescription' },
      { header: 'HSN CODE', dataKey: 'hsnCode' },
      { header: 'QTY', dataKey: 'qty' },
      { header: 'RATE', dataKey: 'rate' },
      { header: 'ADDITIONAL FEE', dataKey: 'additionalFee' },
      { header: 'TAXABLE AMOUNT', dataKey: 'taxableAmount' },
    ];
    let tablecontt = 0;

    doc.autoTable({
      columns: columns,
      body: serviceTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [193, 223, 242],
        textColor: "#4d606b",
        halign: 'center',
        lineColor: "#4d606b",
        lineWidth: 0.4,
      },
      bodyStyles: {
        halign: 'center',
        lineColor: "#4d606b",
        textColor: "#000",
        lineWidth: 0.4,
      },
      didParseCell: function (data) {
        const rowIndex = data.row.index;
        const isLastRow = rowIndex === serviceTableBody.length - 1;
        if (isLastRow) {
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 0) {
          data.cell.styles.halign = 'left';
        }
      },
      // Apply startY only to the first page
      startY: tableStartY, // For example: 40
      margin: { left: leftMargin, right: leftMargin }, // remove top margin override
      tableWidth: 'auto',
      tableLineColor: "#4d606b",
      tableLineWidth: 0.4,

      // 👇 This controls page layout on each new page
      didDrawPage: function (data) {
        if (data.pageNumber > 1) {
          tablecontt = 0;
          doc.setFontSize(12);
        }
        else if (data.pageNumber == 1) {
          tablecontt = 1;
        }
      }
    });

    if (tablecontt == 1) {
      doc.addPage();
    }
    // Constants for layout
    // addFooter(doc); // Add footer for this page

    // doc.addPage();
    // addFooter(doc); // Add footer for this page
    let overAllCgstTax = 0;
    let overAllSgstTax = 0;
    let overAllIGSTTax = 0;

    // Check if intra-state (same state, e.g., state_code "29")
    if (customer.state_code === "29") {
      overAllCgstTax = overallApplicationsTotalPricingWithAdditionalFee * (overAllCgstPercentage / 100);
      overAllSgstTax = overallApplicationsTotalPricingWithAdditionalFee * (overAllSgstPercentage / 100);
      overAllIGSTTax = 0; // No IGST for intra-state
    } else {
      overAllIGSTTax = overallApplicationsTotalPricingWithAdditionalFee * (overallApplicationsTotalPricingWithAdditionalFee / 100); // IGST applied in inter-state
      overAllCgstTax = 0;
      overAllSgstTax = 0;
    }

    // Total GST
    const overAllTotalTax = overAllCgstTax + overAllSgstTax + overAllIGSTTax;

    // Total amount including tax
    const overAllAmountWithTax = overallApplicationsTotalPricingWithAdditionalFee + overAllTotalTax;
    setoverAllAmountWithTax(overAllAmountWithTax);
    const overAllAmountWithTaxs = overAllAmountWithTax;

    const bankDetails = [
      { label: 'Bank Name', value: String(companyInfo?.bank_name || "N/A") },
      { label: 'Bank A/C No', value: String(companyInfo?.bank_account_number || "N/A") },
      { label: 'Bank Branch', value: String(companyInfo?.bank_branch_name || "N/A") },
      { label: 'Bank IFSC/ NEFT/ RTGS', value: String(companyInfo?.bank_ifsc || "N/A") },
      { label: 'MICR', value: String(companyInfo?.bank_micr || "N/A") },
    ];

    // Ensure all values are strings
    const taxDetails = [
      { label: `CGST ${overAllCgstPercentage}%`, value: formatAmount(overAllCgstTax) },
      { label: `SGST ${overAllSgstPercentage}%`, value: formatAmount(overAllSgstTax) },
      {
        label: `IGST ${overAllTotalTaxPercentage}%`,
        value: customer.state_code === "29" ? formatAmount(0) : formatAmount(overAllIGSTTax)
      },
      { label: 'Total GST', value: formatAmount(overAllTotalTax) },
      { label: 'Total Amount with Tax (Round off)', value: formatAmount(overAllAmountWithTax) },
    ];

    const overAllCgstTaxs = overAllCgstTax;
    const overAllSgstTaxs = overAllSgstTax;
    const overAllIGSTTaxs = overAllIGSTTax;
    const totalGsts = overAllTotalTax;


    const bankDetailsWidth = (pageWidth - leftMargin * 2) * 0.4; // 40% width for Bank Details
    const taxDetailsWidth = (pageWidth - leftMargin * 2) * 0.6; // 60% width for Tax Details
    let tableStartYNew = doc.lastAutoTable.finalY + 10; // Starting Y position right below the page margin
    let currentY = tableStartYNew + 12; // Starting position after headers

    if (tablecontt == 1) {
      console.log('tablecontt', tablecontt)
      currentY = 32; // Starting position after headers
      tableStartYNew = 20;
    }

    // Title
    doc.setFont("helvetica", "bold");

    doc.setFontSize(10);
    doc.setFillColor(193, 223, 242); // Sky blue
    doc.setDrawColor(77, 96, 107);   // Border color
    doc.setTextColor(77, 96, 107);   // Text color
    doc.rect(leftMargin, tableStartYNew, bankDetailsWidth, 12, 'FD'); // Bank Details Header
    doc.text("SCREENINGSTAR BANK ACCOUNT AND TAX DETAILS", leftMargin + 5, tableStartYNew + 7);
    // Defines the height of the header row

    doc.setDrawColor(0); // Black border (grayscale)

    doc.setFillColor(193, 223, 242); // Sky blue
    doc.rect(leftMargin + bankDetailsWidth, tableStartYNew, taxDetailsWidth, 12, 'FD'); // Tax Details Header
    const headerHeight = 12;
    const labelWidths = taxDetailsWidth * 0.6; // 60% width for the label
    const valueWidths = taxDetailsWidth * 0.4; // 40% width for the value

    // Start position for the "TOTAL AMOUNT BEFORE TAX" to align with bankDetailsWidth
    const startX = leftMargin + bankDetailsWidth;  // This makes sure it starts after the bank details column
    doc.setFillColor(193, 223, 242); // Sky blue
    doc.setDrawColor(77, 96, 107);   // Border color
    doc.setTextColor(77, 96, 107);
    const totalBeforeTaxLabel = "TOTAL AMOUNT BEFORE TAX";
    const labelXPosition = startX + (labelWidths / 2) - (doc.getTextDimensions(totalBeforeTaxLabel).w / 2);
    doc.rect(startX, tableStartYNew, labelWidths, headerHeight, 'FD');
    doc.text(totalBeforeTaxLabel, labelXPosition, tableStartYNew + 7);

    function formatAmountInt(amount) {
      const num = parseFloat(amount);
      return Number.isInteger(num) ? num.toString() : num.toFixed(2);
    }

    const valueXPosition = startX + labelWidths + (valueWidths / 2) - (doc.getTextDimensions(formatAmountInt(overallApplicationsTotalPricingWithAdditionalFee.toFixed(2))).w / 2); // Centered

    doc.setFillColor(193, 223, 242); // Sky blue
    doc.rect(startX + labelWidths, tableStartYNew, valueWidths, headerHeight); // Draw value column
    doc.text(formatAmountInt(overallApplicationsTotalPricingWithAdditionalFee.toFixed(2)), valueXPosition, tableStartYNew + 7);

    const getRowHeight = (label, value) => {
      const labelHeight = doc.getTextDimensions(label).h;
      const valueHeight = doc.getTextDimensions(value).h;
      return Math.max(labelHeight, valueHeight, 12);
    };

    const maxRows = Math.max(bankDetails.length, taxDetails.length);
    doc.setTextColor(0, 0, 0);
    for (let i = 0; i < maxRows; i++) {
      const bankItem = bankDetails[i] || { label: "", value: "" };
      const taxItem = taxDetails[i] || { label: "", value: "" };
      const rowHeight = 7;

      doc.setFont("helvetica", "normal");
      doc.rect(leftMargin, currentY, bankDetailsWidth / 2, rowHeight);
      doc.text(bankItem.label, leftMargin + 5, currentY + 5);

      doc.rect(leftMargin + bankDetailsWidth / 2, currentY, bankDetailsWidth / 2, rowHeight);
      doc.text(bankItem.value, leftMargin + bankDetailsWidth / 2 + 5, currentY + 5);

      const taxLabelWidth = taxDetailsWidth * 0.6;
      const taxValueWidth = taxDetailsWidth * 0.4;

      const labelXPosition = leftMargin + bankDetailsWidth + (taxLabelWidth / 2) - (doc.getTextDimensions(taxItem.label).w / 2);
      doc.rect(leftMargin + bankDetailsWidth, currentY, taxLabelWidth, rowHeight);
      doc.text(taxItem.label, labelXPosition, currentY + 5);

      const valueXPosition = leftMargin + bankDetailsWidth + taxLabelWidth + (taxValueWidth / 2) - (doc.getTextDimensions(taxItem.value).w / 2);
      doc.rect(leftMargin + bankDetailsWidth + taxLabelWidth, currentY, taxValueWidth, rowHeight);
      doc.text(taxItem.value, valueXPosition, currentY + 5);

      currentY += rowHeight;
    }

    // Special formatting for Total Tax Amount
    const lastRowHeight = getRowHeight("Total Tax Amount :", "Zero Rupees Only");
    doc.setFont("helvetica", "bold");
    doc.rect(leftMargin, currentY, bankDetailsWidth + taxDetailsWidth, lastRowHeight);
    const labelText = 'Total Tax Amount :';
    const taxAmountInWords = numberToWords(overAllAmountWithTax);

    // Set bold font and black color for label
    doc.setFont('helvetica', 'bold');
    doc.text(labelText, leftMargin + 5, currentY + 7);

    // Measure width of the label to calculate where to start the value
    const labelWidth = doc.getTextWidth(labelText);

    // Set normal font and light gray color for value
    doc.setFont('helvetica', 'normal');
    doc.text(taxAmountInWords, leftMargin + 5 + labelWidth + 2, currentY + 7); // 2 is small padding

    doc.setFont('helvetica', 'normal');

    currentY += lastRowHeight;

    // Build headers
    const serviceCodeHeaders = serviceCodes.map(code => ({
      header: `${code}`,
      dataKey: `serviceCode${code}`
    }));

    const annexureHeight = 6; // Background height
    let annexureY = topMargin + currentY - 5; // Position below the columns

    // Draw background rectangle
    doc.setFillColor(193, 223, 242);
    doc.setDrawColor(0); // Black border (grayscale)

    doc.rect(leftMargin, annexureY, pageWidth - 2 * leftMargin, annexureHeight, "FD");

    // Add centered "TAX INVOICE" text
    const annexureX = pageWidth / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setDrawColor(0); // Black border (grayscale)

    doc.setTextColor(77, 96, 107); // Equivalent to #4d606b
    doc.text("Annexure", annexureX, annexureY + annexureHeight / 2 + 1, { align: "center" });




    const header = [
      { header: 'Ref ID', dataKey: 'serviceDescription' },
      { header: 'Emp ID', dataKey: 'hsnCode' },
      ...(clientCode === 'SS-OROC' ? [
        { header: 'Check ID', dataKey: 'check_id' },
        { header: 'Ticket ID', dataKey: 'ticket_id' }
      ] : []),
      { header: 'Case Received', dataKey: 'qty' },
      { header: 'Applicant Full Name', dataKey: 'rate' },
      ...serviceCodeHeaders,
      { header: 'Add Fee', dataKey: 'additionalFee' },
      { header: 'Pricing', dataKey: 'taxableAmount' },
      { header: 'Report Date', dataKey: 'reportDate' }
    ];

    // Calculate totals
    const totals = {};
    serviceCodes.forEach(code => {
      totals[`serviceCode${code}`] = 0;
    });
    let totalAdditionalFee = 0;
    let totalTaxableAmount = 0;

    tableBody2.forEach(row => {
      serviceCodes.forEach(code => {
        const key = `serviceCode${code}`;
        totals[key] += parseFloat(row[key]) || 0;
      });
      totalAdditionalFee += parseFloat(row.additionalFee) || 0;
      totalTaxableAmount += parseFloat(row.taxableAmount) || 0;
    });
    const grandTotalRow = {
      serviceDescription: 'Total',
      hsnCode: '',
      ...(clientCode === 'SS-OROC' ? {
        check_id: '',
        ticket_id: ''
      } : {}),
      qty: '',
      rate: '',
      ...Object.fromEntries(serviceCodes.map(code => {
        const total = totals[`serviceCode${code}`];
        return [
          `serviceCode${code}`,
          total % 1 === 0 ? parseInt(total).toString() : total.toFixed(2)
        ];
      })),
      additionalFee: totalAdditionalFee % 1 === 0
        ? parseInt(totalAdditionalFee).toString()
        : totalAdditionalFee.toFixed(2),
      taxableAmount: totalTaxableAmount % 1 === 0
        ? parseInt(totalTaxableAmount).toString()
        : totalTaxableAmount.toFixed(2),
      reportDate: ''
    };

    tableBody2.push(grandTotalRow);

    // Add the table
    doc.autoTable({
      columns: header,
      body: tableBody2,
      theme: 'grid',
      startY: annexureY += 10, // Only for the first table position
      headStyles: {
        fillColor: [193, 223, 242],
        textColor: "#4d606b",
        halign: 'center',
        lineColor: "#4d606b",
        lineWidth: 0.4,
      },
      bodyStyles: {
        halign: 'center',
        lineColor: "#4d606b",
        lineWidth: 0.4,
        textColor: "#000",
      },
      margin: { left: leftMargin, right: leftMargin },
      tableWidth: 'auto',
      tableLineColor: "#4d606b",
      tableLineWidth: 0.4,

      didParseCell: function (data) {
        if (data.row.raw === grandTotalRow) {
          if (data.column.dataKey === 'serviceDescription') {
            data.cell.colSpan = 4;
            data.cell.styles.fontStyle = 'bold';
          }
          if (['hsnCode', 'qty', 'rate'].includes(data.column.dataKey)) {
            data.cell.colSpan = 0;
          }

        }
      }
    });
    // addFooter(doc); // Add footer for this page

    let services = [];
    let tempArray = [];

    // Loop through serviceNames
    serviceNames.forEach((service, index) => {
      // Create an object for each service with serviceDescription and hsnCode
      const serviceObject = {
        serviceDescription: service.title,  // Assuming 'title' corresponds to serviceDescription
        hsnCode: service.shortCode         // Assuming 'shortCode' corresponds to hsnCode
      };

      // Push the service object into tempArray
      tempArray.push(serviceObject);

      // When tempArray reaches 6 items or it's the last service, push it to services
      if (tempArray.length === 6 || index === serviceNames.length - 1) {
        services.push(...tempArray);  // Use spread operator to push individual objects
        tempArray = [];  // Reset tempArray
      }
    });


    // Determine how many entries per row (in this case, 3 per row)
    const entriesPerRow = 3;

    // Dynamically generate columns based on entries per row
    const header2 = [];
    for (let i = 1; i <= entriesPerRow; i++) {
      header2.push({ header: `S CODE ${i}`, dataKey: `serviceDescription${i}` });
      header2.push({ header: `VERIFICATION SERVICES ${i}`, dataKey: `hsnCode${i}` });
    }

    // Function to dynamically generate rows based on the service data
    const row2 = [];
    for (let i = 0; i < services.length; i += entriesPerRow) {
      const row = {};
      for (let j = 0; j < entriesPerRow; j++) {
        const index = i + j;
        if (services[index]) {
          row[`hsnCode${j + 1}`] = services[index].hsnCode;
          row[`serviceDescription${j + 1}`] = services[index].serviceDescription;
        } else {
          row[`hsnCode${j + 1}`] = '';
          row[`serviceDescription${j + 1}`] = '';
        }
      }
      row2.push(row);
    }


    // Constants
    const margin = 10;
    const headerHeightNew = 8;
    const annexureText = "ANNEXURE - SCOPE OF SERVICES NAME AND CODES";
    const estimatedTableHeight = row2.length * 8 + 20; // estimate ~8px per row + padding
    const totalHeightNeeded = headerHeightNew + estimatedTableHeight;

    const previousTable = doc.lastAutoTable;
    const previousFinalY = previousTable ? previousTable.finalY : 20;

    let myheight = previousFinalY + 10;
    let remainingSpace = pageHeight - myheight;

    // If not enough space for both header + table, add a new page
    if (remainingSpace < totalHeightNeeded) {
      doc.addPage();
      myheight = 20; // reset top margin
      currentY = 20;
      annexureY = 0;
    }

    // === Draw Header ===
    const headerTopY = myheight;
    console.log('headerTopY:', headerTopY);

    const headerBottomY = headerTopY + headerHeightNew;
    const textYNew = headerTopY + headerHeightNew / 2 + 1.5;
    const headerWidth = pageWidth - margin * 2;

    doc.setTextColor("#4d606b");
    doc.setFillColor(193, 223, 242);
    doc.rect(margin, headerTopY, headerWidth, headerHeightNew, "F"); // Filled rectangle
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, headerTopY, headerWidth, headerHeightNew); // Border

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(annexureText, pageWidth / 2, textYNew, { align: "center" });
    doc.setFont("helvetica", "normal");

    // === Draw Table ===
    doc.autoTable({
      startY: headerBottomY,
      columns: header2,
      body: row2,
      theme: 'grid',
      showHead: 'firstPage',
      headStyles: {
        fillColor: [193, 223, 242],
        textColor: "#4d606b",
        halign: 'center',
        lineColor: "#4d606b",
        lineWidth: 0.4,
        fontSize: 8,
      },
      bodyStyles: {
        halign: 'center',
        lineColor: "#4d606b",
        lineWidth: 0.4,
        textColor: "#000",
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
      },
      margin: { left: margin, right: margin },
      tableWidth: headerWidth,
      tableLineColor: "#4d606b",
      tableLineWidth: 0.4,
    });

    doc.addPage();
    const headingYPosition = 10;

    // New Page for Notes
    // addFooter(doc); // Add footer for this page

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("SPECIAL NOTES, TERMS AND CONDITIONS", pageWidth / 2, headingYPosition + 5, { align: "center" });
    doc.rect(margin, headingYPosition, headerWidth, 10); // Rectangle for heading
    doc.setTextColor(0, 0, 0); // Black text

    // Notes Section
    const notesYPosition = headingYPosition + 15;
    const notes = [
      "1. Payments should be made via cheques/DDs/NEFT/RTGS transfers as per the payment details shown above.",
      "2. All the payments should be payable in the name of M/s. 'SCREENINGSTAR SOLUTIONS PRIVATE LIMITED'.",
      "3. All cheques should be drawn crossed A/c Payee.",
      "4. While making payment please handover payment advice with full details.",
      "5. Kindly revert back in writing regarding any query pertaining to this bill within 7 days from the date of bill, otherwise this bill shall be deemed to be correct and payable by you.",
      "6. Please email us at accounts@screeningstar.com.",
      "7. Invoice to be paid on or before 30 days from the date of invoice or within the credit period as per agreement.",
      "8. Any delay in payment attracts an interest @24% per annum."
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(notes, margin + 2, notesYPosition, { maxWidth: headerWidth - 4, lineHeightFactor: 1.5 });

    // Add Stamp and Signature
    const stampYPosition = notesYPosition + (notes.length * 5) + 10;
    doc.addImage(
      "https://webstepdev.com/screeningstarAssets/tags-9654471.png",
      "PNG",
      margin + 5,
      stampYPosition,
      60,
      30
    );
    doc.setFontSize(9);
    const leftMarging = 20; // or whatever your margin is
    doc.text("Authorized Signatory", leftMarging, stampYPosition + 40);

    // Border for Notes Section
    const notesSectionHeight = stampYPosition + 50 - notesYPosition;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, notesYPosition - 5, headerWidth, notesSectionHeight);

    addFooter(doc);

    const invoiceDate = new Date(formData.invoice_date);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const formattedDate = `${monthNames[invoiceDate.getMonth()]}_${invoiceDate.getFullYear()}`;

    doc.save(`${clientCode || "N/A"}-${formattedDate}`);

    fetchPdfData(overAllCgstTaxs, overAllSgstTaxs, overAllIGSTTaxs, totalGsts, totalAmounts, taxableValuess, overAllAmountWithTaxs, companynames, customer);


  };



  return (
    <>
      <div className="w-full border border-black overflow-hidden">
        <div className="bg-white text-left  md:p-12 p-6   w-full mx-auto">
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label htmlFor="clrefin" className="block mb-2">
                Client Code<span className="text-red-500 text-xl">*</span>
              </label>
              <SelectSearch
                options={options.length === 0 ? [{ value: '0', name: 'No data available in table' }] : options}
                value={formData.client_code}
                name="client_code"
                placeholder={options.length === 0 ? 'No data available in table' : 'Choose your language'}
                onChange={(value) => {
                  // Update formData with selected client.id
                  handleChange({ target: { name: 'client_code', value } });

                  // Find original client in activeList using ID
                  const selectedClient = activeList.find(client => client.id === value);

                  // Set client_unique_id (e.g., 'ss-ind') to state
                  setClientCode(selectedClient?.client_unique_id || '');
                }}
                search
                disabled={options.length === 0}
              />



              {errors.client_code && <p className="text-red-500 text-sm">{errors.client_code}</p>}
            </div>

            <div>
              <label htmlFor="invnum" className="block mb-2">
                Invoice Number:<span className="text-red-500 text-xl">*</span>
              </label>
              <input
                type="text"
                name="invoice_number"
                id="invoice"
                placeholder="Invoice Number"
                onChange={handleChange}
                value={formData.invoice_number}
                className="w-full p-3 bg-[#f7f6fb]  border border-gray-300 rounded-md"
              />
              {errors.invoice_number && <p className="text-red-500 text-sm">{errors.invoice_number}</p>}
            </div>

            <div>
              <label htmlFor="invoice_date" className="block mb-2">
                Invoice Date:<span className="text-red-500 text-xl">*</span>
              </label>
              <DatePicker
                id="invoice_date"
                name="invoice_date"
                selected={
                  formData.invoice_date && formData.invoice_date.trim() !== ""
                    ? parseISO(formData.invoice_date)
                    : null
                }
                onChange={(date) => {
                  if (!date) {
                    setFormData({ ...formData, invoice_date: "" });
                    return;
                  }
                  const formatted = format(date, "yyyy-MM-dd"); // Save in backend format
                  setFormData({ ...formData, invoice_date: formatted });
                }}
                dateFormat="dd-MM-yyyy" // Show in user-friendly format
                placeholderText="DD-MM-YYYY"
                className="uppercase w-full p-3 bg-[#f7f6fb] border border-gray-300 rounded-md"
              />
              {errors.invoice_date && <p className="text-red-500 text-sm">{errors.invoice_date}</p>}
            </div>

            <div>
              <label htmlFor="moinv" className="block mb-2">
                Month:<span className="text-red-500 text-xl">*</span>
              </label>
              <select
                id="month"
                name="month"
                onChange={handleChange}
                value={formData.month}
                className="w-full p-3 mb-[20px] bg-[#f7f6fb]  border border-gray-300 rounded-md"
              >
                <option>--Select Month--</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              {errors.month && <p className="text-red-500 text-sm">{errors.month}</p>}
            </div>
            <div>
              <label htmlFor="moinv" className="block mb-2">
                Year:<span className="text-red-500 text-xl">*</span>
              </label>
              <select
                id="year"
                name="year"
                onChange={handleChange}
                value={formData.year}
                className="w-full p-3 mb-[20px] bg-[#f7f6fb]  border border-gray-300 rounded-md"
              >
                <option>--Select Year--</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
              {errors.year && <p className="text-red-500 text-sm">{errors.year}</p>}
            </div>

            <div className="text-left">
              <button
                type="submit"
                className={`p-6 py-3 bg-[#2c81ba] text-white  hover:scale-105 font-bold rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default GenerateInvoice;
