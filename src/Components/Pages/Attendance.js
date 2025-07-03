////old code


import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from "../ApiLoadingContext";
import Default from "../../imgs/default.png";
import { saveAs } from "file-saver";
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

const Attendance = () => {
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const [responseError, setResponseError] = useState(null);
  const [filtredDataRaw, setFiltredDataRaw] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [fromMonthYear, setFromMonthYear] = useState(""); // '06/2025'
  const [toMonthYear, setToMonthYear] = useState("");     // '07/2025'

  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200];
  const navigate = useNavigate();

  function groupByAdmin(data) {
    const grouped = {};

    data.forEach(entry => {
      const {
        admin_id,
        admin_name,
        profile_picture,
        admin_email,
        admin_mobile,
        emp_id,
        date,
        first_login_time,
        last_logout_time,
        break_times
      } = entry;

      if (!grouped[admin_id]) {
        grouped[admin_id] = {
          admin_id,
          admin_name,
          profile_picture,
          admin_email,
          admin_mobile,
          emp_id,
          daily_records: {}
        };
      }

      const dt = new Date(date);
      const year = dt.getFullYear().toString();
      const month = String(dt.getMonth() + 1).padStart(2, '0');

      if (!grouped[admin_id].daily_records[year]) {
        grouped[admin_id].daily_records[year] = {};
      }

      if (!grouped[admin_id].daily_records[year][month]) {
        grouped[admin_id].daily_records[year][month] = [];
      }

      grouped[admin_id].daily_records[year][month].push({
        date,
        first_login_time,
        last_logout_time,
        break_times
      });
    });

    // Sort each month's records by date ASCENDING
    Object.values(grouped).forEach(admin => {
      const yearKeys = Object.keys(admin.daily_records);
      yearKeys.forEach(year => {
        const monthKeys = Object.keys(admin.daily_records[year]);
        monthKeys.forEach(month => {
          admin.daily_records[year][month].sort((a, b) => new Date(a.date) - new Date(b.date));
        });
      });
    });

    return Object.values(grouped);
  }

  function transformAttendanceData(data) {
    const result = {};

    data.forEach(admin => {
      const {
        admin_id,
        admin_name,
        profile_picture,
        admin_email,
        admin_mobile,
        emp_id,
        daily_records
      } = admin;

      Object.keys(daily_records).forEach(year => {
        if (!result[year]) result[year] = [];

        Object.keys(daily_records[year]).forEach(month => {
          // Find if the month already exists in result[year]
          let monthEntry = result[year].find(entry => entry[month]);

          if (!monthEntry) {
            monthEntry = { [month]: [] };
            result[year].push(monthEntry);
          }

          // Push the current admin's month data to the month array
          monthEntry[month].push({
            admin_id,
            admin_name,
            profile_picture,
            admin_email,
            admin_mobile,
            emp_id,
            daily_records: {
              [year]: {
                [month]: daily_records[year][month]
              }
            }
          });
        });
      });
    });

    return result;
  }

  const fetchData = useCallback((from, to) => {
    setLoading(true);
    setApiLoading(true);
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      console.error("Missing admin_id or _token");
      setLoading(false);
      setApiLoading(false);
      return;
    }

    // ✅ Construct base URL
    let url = `https://api.screeningstar.co.in/personal-manager/attendance-list?admin_id=${admin_id}&_token=${storedToken}`;

    // ✅ Append optional parameters if provided
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;

    fetch(url, {
      method: "GET",
      redirect: "follow",
    })
      .then((response) => {
        return response.json().then((result) => {
          // Check if the API response status is false
          if (result.status === false) {
            // Log the message from the API response
            console.error("API Error:", result.message);
            Swal.fire("Error!", `${result.message}`, "error");
            setResponseError(result.message);

            // Optionally, you can throw an error here if you want to halt the further execution
            throw new Error(result.message);
          }
          return result;
        });
      })
      .then((result) => {
        const newToken = result.token || result._token || storedToken || "";
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }

        const groupedResult = groupByAdmin(result.data.attendance_records);
        const transformed = transformAttendanceData(groupedResult);

        setTableData(transformed || []);
        setLeaveSummary(result.data.leave_summary || []);
      })
      .catch((error) => {
        console.error("Fetch error:", error);

      })
      .finally(() => {
        setApiLoading(false);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoading == false) {
          await validateAdminLogin();
          await fetchData();
        }
      } catch (error) {
        console.error(error.message);
        navigate("/admin-login");
      }
    };

    initialize();
  }, [navigate, fetchData]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const formatDate = (date) => {
    if (!date || date === "null" || date === "undefined") return "";

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "";

    // Convert to IST (UTC+5:30)
    const utcOffset = 5.5 * 60 * 60 * 1000;
    const istDateObj = new Date(dateObj.getTime() + utcOffset);

    // Extract time components
    let hours = istDateObj.getUTCHours();
    const minutes = String(istDateObj.getUTCMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const formatDate2 = (date) => {
    const dateObj = new Date(date);

    // Convert to IST (UTC+5:30)
    const utcOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istDateObj = new Date(dateObj.getTime() + utcOffset);

    // Extract IST date components
    const year = istDateObj.getUTCFullYear();
    const month = String(istDateObj.getUTCMonth() + 1).padStart(2, "0");
    const day = String(istDateObj.getUTCDate()).padStart(2, "0");

    return `${day}-${month}-${year}`;
  };

  const formatToYYYYMMDD = (date) => {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // Output: YYYY-MM-DD
  };

  const normalizeString = (str) =>
    str?.toLowerCase().replace(/\s+/g, " ").trim() || "";

  const searchTermNormalized = normalizeString(searchTerm);

  // ✅ Maintain same structure as tableData
  let filteredData = {};

  if (!searchTermNormalized) {
    // Return full data unfiltered
    filteredData = tableData;
  } else {
    filteredData = {};

    Object.entries(tableData || {}).forEach(([year, monthArray]) => {
      monthArray.forEach(monthObj => {
        Object.entries(monthObj).forEach(([month, admins]) => {
          const matchedAdmins = [];

          admins.forEach(admin => {
            const adminNameNormalized = normalizeString(admin.admin_name);
            const adminEmailNormalized = normalizeString(admin.admin_email);
            const adminMobileNormalized = normalizeString(admin.admin_mobile?.toString());

            const matchesSearchTerm =
              adminNameNormalized.includes(searchTermNormalized) ||
              adminEmailNormalized.includes(searchTermNormalized) ||
              adminMobileNormalized.includes(searchTermNormalized);

            const records = admin.daily_records?.[year]?.[month] || [];

            const filteredRecords = records.filter(record => {
              if (!startDate && !endDate) return true;

              const loginDate = new Date(record.first_login_time);
              const from = startDate ? new Date(startDate) : null;
              const to = endDate ? new Date(endDate) : null;

              if (from && to) return loginDate >= from && loginDate <= to;
              if (from) return loginDate >= from;
              if (to) return loginDate <= to;

              return true;
            });

            if (matchesSearchTerm && filteredRecords.length > 0) {
              const filteredAdmin = {
                ...admin,
                daily_records: {
                  [year]: {
                    [month]: filteredRecords
                  }
                }
              };
              matchedAdmins.push(filteredAdmin);
            }
          });

          if (matchedAdmins.length > 0) {
            if (!filteredData[year]) filteredData[year] = [];

            // Find if month already exists
            let existingMonth = filteredData[year].find(m => m[month]);
            if (!existingMonth) {
              filteredData[year].push({ [month]: matchedAdmins });
            } else {
              existingMonth[month] = matchedAdmins;
            }
          }
        });
      });
    });
  }


  const handleFilter = async () => {
    console.log("Filter triggered");
    await fetchData(fromMonthYear, toMonthYear);
  };
  console.log('setFiltredDataRaw', filtredDataRaw)

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = Array.isArray(filteredData)
    ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const exportToExcel = () => {
    const date = new Date();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const headers = [
      "SL NO",
      "EMPLOYEE ID",
      "NAME OF THE EMPLOYEE",
      "ATTENDANCE",
    ];
    for (let i = 1; i <= daysInMonth; i++) headers.push(i.toString());
    headers.push("LEAVE", "PRESENT", "LEAVE FROM", "LEAVE TO");

    const attendanceTypes = [
      { label: "LOGIN", key: "login" },
      { label: "TEA BREAK IN-1", key: "tea break in-1" },
      { label: "TEA BREAK OUT-1", key: "tea break out-1" },
      { label: "LUNCH BREAK IN", key: "lunch break in" },
      { label: "LUNCH BREAK OUT", key: "lunch break out" },
      { label: "TEA BREAK IN-2", key: "tea break in-2" },
      { label: "TEA BREAK OUT-2", key: "tea break out-2" },
      { label: "LOGOUT", key: "logout" },
    ];

    const exportData = [headers];
    const merges = [];

    let currentRow = 1;

    paginatedData.forEach((emp, empIndex) => {
      attendanceTypes.forEach((type, rowIndex) => {
        const row = [];
        row.push(rowIndex === 0 ? empIndex + 1 : ""); // SL NO
        row.push(rowIndex === 0 ? emp.emp_id : ""); // EMPLOYEE ID
        row.push(rowIndex === 0 ? emp.admin_name : ""); // NAME
        row.push(type.label); // ATTENDANCE TYPE

        for (let i = 1; i <= daysInMonth; i++) {
          const currentDate = new Date(emp.date);
          const isMatch = currentDate.getDate() === i;

          let value = "";

          if (isMatch) {
            if (type.key === "login") {
              value = emp.first_login_time;
            } else if (type.key === "logout") {
              value = emp.last_logout_time;
            } else {
              value = emp.break_times?.[type.key.toLowerCase()] || "";
            }
          }

          row.push(value ? formatDate(value) : "");
        }

        // Add LEAVE/PRESENT/FROM/TO only for first attendanceType
        if (rowIndex === 0) {
          row.push(emp.status === "On Leave" ? 1 : 0); // LEAVE
          row.push(emp.status === "Present" ? 1 : 0); // PRESENT
          row.push(emp.from_date ? formatDate2(emp.from_date) : "");
          row.push(emp.to_date ? formatDate2(emp.to_date) : "");
        } else {
          row.push("", "", "", ""); // empty if not first row
        }

        exportData.push(row);
      });

      // Add merges for SL NO, EMP ID, NAME, and LEAVE/PRESENT/FROM/TO
      const startRow = currentRow;
      const endRow = currentRow + attendanceTypes.length - 1;

      const mergeColumns = [0, 1, 2]; // SL NO, EMP ID, NAME
      mergeColumns.forEach((col) => {
        merges.push({ s: { r: startRow, c: col }, e: { r: endRow, c: col } });
      });

      const summaryStartCol = 4 + daysInMonth; // after attendance dates
      for (let col = summaryStartCol; col <= summaryStartCol + 3; col++) {
        merges.push({ s: { r: startRow, c: col }, e: { r: endRow, c: col } });
      }

      currentRow += attendanceTypes.length;
    });

    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    worksheet["!merges"] = merges;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    XLSX.writeFile(workbook, "Attendance.xlsx");
  };



  const Loader = () => (
    <tr>
      <td colSpan="100">
        <div className="flex w-full justify-center items-center h-20">
          <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
      </td>
    </tr>
  );

  const [expandedRow, setExpandedRow] = useState(null);

  const handleView = (adminId) => {
    setExpandedRow((prev) => (prev === adminId ? null : adminId));
  };
  // Function to format the date and time to "Day-Month-Year Hours:Minutes:Seconds" format
  // Function to format the date and time to "Day-Month-Year Hours:Minutes AM/PM" format

  function getDaysInMonth(year, month) {
    return new Date(year, parseInt(month), 0).getDate(); // month = "07" → 7
  }

  // Helper: convert 'MM/yyyy' to Date
  const parseMonthYearString = (str) => {
    if (!str) return null;
    const [month, year] = str.split("/");
    return new Date(parseInt(year), parseInt(month) - 1);
  };

  // Single handler for both
  const handleMonthYearChange = (date, setState) => {
    if (date instanceof Date && !isNaN(date)) {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      setState(`${month}/${year}`);
    } else {
      setState("");
    }
  };

  console.log(`filteredData - `, filteredData);

  return (
    <div className="bg-[#c1dff2] border border-black">
      <div className="bg-white p-12 w-full mx-auto">
        {/* Filter Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6 p-4 bg-white rounded-lg shadow-sm border">
          {/* Left Filters */}
          <div className="w-full md:w-2/3 space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Search by Name</label>
              <input
                type="text"
                placeholder="Enter name, email or mobile"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full border rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/*
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">From Date</label>
                  <DatePicker
                    selected={startDate ? parseISO(startDate) : null}
                    onChange={(date) => setStartDate(date ? format(date, "yyyy-MM-dd") : "")}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="DD-MM-YYYY"
                    className="w-full border px-4 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">To Date</label>
                  <DatePicker
                    selected={endDate ? parseISO(endDate) : null}
                    onChange={(date) => setEndDate(date ? format(date, "yyyy-MM-dd") : "")}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="DD-MM-YYYY"
                    className="w-full border px-4 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm uppercase"
                  />
                </div>
              </div>
            */}

            {/* Month & Year Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              {/* From Picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">From</label>
                <DatePicker
                  selected={parseMonthYearString(fromMonthYear)}
                  onChange={(date) => handleMonthYearChange(date, setFromMonthYear)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  className="w-full border px-4 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  placeholderText="Select From"
                />
              </div>

              {/* To Picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">To</label>
                <DatePicker
                  selected={parseMonthYearString(toMonthYear)}
                  onChange={(date) => handleMonthYearChange(date, setToMonthYear)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  className="w-full border px-4 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  placeholderText="Select To"
                />
              </div>
            </div>

            {/* Search Button */}
            <div>
              <button
                onClick={handleFilter}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md shadow-sm transition duration-150"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Right - Export */}
          <div className="w-full md:w-auto">
            <button
              onClick={exportToExcel}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-md shadow-sm transition duration-150 hover:scale-105"
            >
              Export to Excel
            </button>
          </div>
        </div>


        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-black rounded-lg whitespace-nowrap mb-4">
            <thead>
              <tr className="bg-[#c1dff2] text-[#4d606b] text-center">
                <th className="border border-black px-4 py-2">SL NO</th>
                <th className="border border-black px-4 py-2">EMPLOYEE ID</th>
                <th className="border border-black px-4 py-2">NAME OF THE EMPLOYEE</th>
                <th className="border border-black px-4 py-2">ATTENDANCE</th>
                {Array.from({ length: 31 }, (_, i) => (
                  <th key={i + 1} className="border border-black px-2 py-2">{i + 1}</th>
                ))}
                <th className="border border-black px-4 py-2">LEAVE</th>
                <th className="border border-black px-4 py-2">PRESENT</th>
                <th className="border border-black px-4 py-2">LEAVE FROM</th>
                <th className="border border-black px-4 py-2">LEAVE TO</th>
                <th className="border border-black px-4 py-2">LEAVE REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(filteredData).flatMap(([year, monthArray]) =>
                monthArray.flatMap(monthObj =>
                  Object.entries(monthObj).flatMap(([month, admins], monthIndex) => {
                    return [
                      // 🟨 Render Month-Year Header Row Once
                      <tr key={`header-${year}-${month}`} className="bg-yellow-100 text-center font-bold text-black">
                        <td colSpan={35} className="border border-black py-2 text-lg">
                          ATTENDANCE SHEET — {month.padStart(2, '0')}/{year}
                        </td>
                      </tr>,

                      // 👤 Render Admin Rows
                      ...admins.map((admin, adminIndex) => {
                        const breakTypes = [
                          "LOGIN",
                          "TEA BREAK IN-1",
                          "TEA BREAK OUT-1",
                          "LUNCH BREAK IN",
                          "LUNCH BREAK OUT",
                          "TEA BREAK IN-2",
                          "TEA BREAK OUT-2",
                          "LOGOUT"
                        ];

                        const monthRecords = admin.daily_records[year]?.[month] || [];
                        const presentCount = monthRecords.filter(r => r.first_login_time || r.last_logout_time).length;
                        const leaveCount = monthRecords.length - presentCount;
                        const leaveFrom = monthRecords.find(r => !r.first_login_time && !r.last_logout_time)?.date || "";
                        const leaveTo = [...monthRecords].reverse().find(r => !r.first_login_time && !r.last_logout_time)?.date || "";
                        const adminLeaveSummary = Array.isArray(leaveSummary[admin.admin_id])
                          ? leaveSummary[admin.admin_id]
                          : [];

                        return breakTypes.map((label, i) => (
                          <tr key={`${admin.emp_id}-${label}-${year}-${month}`} className="text-center">
                            {i === 0 && (
                              <>
                                <td rowSpan={breakTypes.length} className="border border-black">{adminIndex + 1}</td>
                                <td rowSpan={breakTypes.length} className="border border-black">{admin.emp_id}</td>
                                <td rowSpan={breakTypes.length} className="border border-black">{admin.admin_name}</td>
                              </>
                            )}
                            <td className="border border-black">{label}</td>
                            {Array.from({ length: 31 }, (_, d) => {
                              const day = d + 1;
                              const record = monthRecords.find(r => new Date(r.date).getDate() === day);
                              const key = label.toLowerCase();
                              let value = "";

                              if (record) {
                                if (label === "LOGIN") value = record.first_login_time;
                                else if (label === "LOGOUT") value = record.last_logout_time;
                                else value = record.break_times?.[key];
                              }

                              return (
                                <td key={d} className="border border-black text-xs px-2 py-1">
                                  {formatDate(value)}
                                </td>
                              );
                            })}
                            {i === 0 && (
                              <>
                                <td rowSpan={breakTypes.length} className="border border-black">{leaveCount}</td>
                                <td rowSpan={breakTypes.length} className="border border-black">{presentCount}</td>
                                {/* Leave From Date */}
                                {/* Leave From Date */}
                                <td rowSpan={breakTypes.length} className="border border-black text-xs leading-tight text-left px-2 py-1">
                                  {adminLeaveSummary.length > 0 ? (
                                    adminLeaveSummary.map((leave, idx) => (
                                      <div
                                        key={`from-${idx}`}
                                        className={`${idx !== 0 ? "border-t border-dashed border-gray-300 mt-1 pt-1" : ""}`}
                                      >
                                        {formatDate2(leave.from_date)}
                                      </div>
                                    ))
                                  ) : (
                                    "-"
                                  )}
                                </td>

                                {/* Leave To Date */}
                                <td rowSpan={breakTypes.length} className="border border-black text-xs leading-tight text-left px-2 py-1">
                                  {adminLeaveSummary.length > 0 ? (
                                    adminLeaveSummary.map((leave, idx) => (
                                      <div
                                        key={`to-${idx}`}
                                        className={`${idx !== 0 ? "border-t border-dashed border-gray-300 mt-1 pt-1" : ""}`}
                                      >
                                        {formatDate2(leave.to_date)}
                                      </div>
                                    ))
                                  ) : (
                                    "-"
                                  )}
                                </td>

                                {/* Purpose of Leave & Remarks */}
                                <td rowSpan={breakTypes.length} className="border border-black text-xs leading-tight text-left px-2 py-1">
                                  {adminLeaveSummary.length > 0 ? (
                                    adminLeaveSummary.map((leave, idx) => (
                                      <div
                                        key={`reason-${idx}`}
                                        className={`mb-1 ${idx !== 0 ? "border-t border-dashed border-gray-300 mt-1 pt-1" : ""}`}
                                      >
                                        <strong>{leave.purpose_of_leave}</strong> <br />
                                        <span className="text-gray-700 text-[11px]">
                                          ({formatDate2(leave.from_date)} - {formatDate2(leave.to_date)})
                                        </span>
                                        {leave.remarks && (
                                          <div className="italic text-gray-500 text-[11px] mt-0.5">“{leave.remarks}”</div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    "-"
                                  )}
                                </td>

                              </>
                            )}
                          </tr>
                        ));
                      })
                    ];
                  })
                )
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
