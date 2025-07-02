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

  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
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


  const fetchData = useCallback(() => {
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

    const url = `https://api.screeningstar.co.in/personal-manager/attendance-list?admin_id=${admin_id}&_token=${storedToken}`;

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
        console.log(`client_spocs - `, result.client_spocs);

        const groupedResult = groupByAdmin(result.client_spocs);
        console.log(`groupedResult - `, groupedResult);

        setTableData(groupedResult || []);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        setTableData([]);
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

  const filteredData = (Array.isArray(tableData) ? tableData : []).filter(
    (row) => {
      const normalizeString = (str) => {
        return str?.toLowerCase().replace(/\s+/g, " ").trim() || "";
      };

      const searchTermNormalized = normalizeString(searchTerm);
      const adminNameNormalized = normalizeString(row?.admin_name);
      const adminEmailNormalized = normalizeString(row?.admin_email);
      const adminMobileNormalized = normalizeString(
        row?.admin_mobile?.toString()
      );

      const matchesSearchTerm =
        adminNameNormalized.includes(searchTermNormalized) ||
        adminEmailNormalized.includes(searchTermNormalized) ||
        adminMobileNormalized.includes(searchTermNormalized);

      const matchesDateRange = (() => {
        if (!startDate && !endDate) return true;

        const loginDate = new Date(row.first_login_time);
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;

        if (from && to) {
          return loginDate >= from && loginDate <= to;
        } else if (from) {
          return loginDate >= from;
        } else if (to) {
          return loginDate <= to;
        }
      })();

      return matchesSearchTerm && matchesDateRange;
    }
  );

  const handleFilter = () => {
    console.log("Filter triggered");

    if (!startDate || !endDate) {
      console.log("Start or End date missing:", { startDate, endDate });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log("Parsed Dates:", { start, end });

    const filteredData = tableData.filter((item, index) => {
      if (!item.date) {
        console.log(`Row ${index} skipped (no date)`, item);
        return false;
      }

      const itemDate = new Date(item.date);
      const inRange = itemDate >= start && itemDate <= end;

      console.log(`Row ${index} - Date: ${item.date}, Parsed: ${itemDate}, In Range: ${inRange}`);
      return inRange;
    });

    if (filteredData.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: "No records found in the selected date range.",
      });
      return;
    }

    setFiltredDataRaw(filteredData);
    setCurrentPage(1);
    console.log("Table data and current page updated");
  };
  console.log('setFiltredDataRaw', filtredDataRaw)

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  console.log('paginatedData', paginatedData)

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


  return (
    <div className="bg-[#c1dff2] border border-black">
      <div className="bg-white p-12 w-full mx-auto">
        {/* Filter Section */}
        <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
          <div className="w-full md:w-1/3 space-y-2">
            <input
              type="text"
              placeholder="Search by Name"
              value={searchTerm}
              onChange={handleSearchChange}
              className="border p-2 rounded w-full shadow-sm focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 w-16">From</label>
              <DatePicker
                selected={startDate ? parseISO(startDate) : null}
                onChange={(date) => setStartDate(date ? format(date, "yyyy-MM-dd") : "")}
                dateFormat="dd-MM-yyyy"
                placeholderText="DD-MM-YYYY"
                className="uppercase border p-2 rounded w-full shadow-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 w-16">To</label>
              <DatePicker
                selected={endDate ? parseISO(endDate) : null}
                onChange={(date) => setEndDate(date ? format(date, "yyyy-MM-dd") : "")}
                dateFormat="dd-MM-yyyy"
                placeholderText="DD-MM-YYYY"
                className="uppercase border p-2 rounded w-full shadow-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={handleFilter}
              className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
            >
              Search
            </button>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-lg px-3 py-2 w-full bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
            >
              {optionsPerPage.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 transition transform hover:scale-105 text-white px-6 py-2 rounded-lg shadow-sm"
          >
            Export to Excel
          </button>
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
                  <th key={i + 1} className="border border-black px-2 py-2">
                    {i + 1}
                  </th>
                ))}
                <th className="border border-black px-4 py-2">LEAVE</th>
                <th className="border border-black px-4 py-2">PRESENT</th>
                <th className="border border-black px-4 py-2">LEAVE FROM</th>
                <th className="border border-black px-4 py-2">LEAVE TO</th>
              </tr>
            </thead>
            <tbody>
              {[...paginatedData].flatMap((admin, index) => {
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

                // Convert to array of { admin, year, month, records } for sorting
                const monthYearGroups = [];

                Object.keys(admin.daily_records).forEach(year => {
                  Object.keys(admin.daily_records[year]).forEach(month => {
                    monthYearGroups.push({
                      admin,
                      year,
                      month,
                      records: admin.daily_records[year][month]
                    });
                  });
                });

                // Sort by year DESC, then month DESC
                monthYearGroups.sort((a, b) => {
                  const ya = parseInt(a.year);
                  const yb = parseInt(b.year);
                  const ma = parseInt(a.month);
                  const mb = parseInt(b.month);
                  return yb !== ya ? yb - ya : mb - ma;
                });

                let rowIndex = index + 1;

                // Render
                return monthYearGroups.map(({ admin, year, month, records }) => {
                  const daysInMonth = getDaysInMonth(year, month);
                  const presentCount = records.filter(r => r.first_login_time || r.last_logout_time).length;
                  const leaveCount = records.length - presentCount;
                  const leaveFrom = records.find(r => !r.first_login_time && !r.last_logout_time)?.date || "";
                  const leaveTo = [...records].reverse().find(r => !r.first_login_time && !r.last_logout_time)?.date || "";

                  return (
                    <React.Fragment key={`${admin.emp_id}-${year}-${month}`}>
                      {/* Month-Year Header Row */}
                      <tr className="bg-yellow-100 text-center font-bold text-black">
                        <td colSpan={35} className="border border-black py-2 text-lg">
                          ATTENDANCE SHEET — {admin.admin_name} ({admin.emp_id}) — {month.padStart(2, '0')}/{year}
                        </td>
                      </tr>

                      {/* Attendance Rows */}
                      {breakTypes.map((label, i) => (
                        <tr key={`${admin.emp_id}-${label}-${year}-${month}`} className="text-center">
                          {i === 0 && (
                            <>
                              <td rowSpan={breakTypes.length} className="border border-black">{rowIndex}</td>
                              <td rowSpan={breakTypes.length} className="border border-black">{admin.emp_id}</td>
                              <td rowSpan={breakTypes.length} className="border border-black">{admin.admin_name}</td>
                            </>
                          )}
                          <td className="border border-black">{label}</td>
                          {Array.from({ length: 31 }, (_, d) => {
                            const day = d + 1;
                            const record = records.find(r => new Date(r.date).getDate() === day);
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
                              <td rowSpan={breakTypes.length} className="border border-black">
                                {leaveFrom ? formatDate2(leaveFrom) : ""}
                              </td>
                              <td rowSpan={breakTypes.length} className="border border-black">
                                {leaveTo ? formatDate2(leaveTo) : ""}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                });
              })}

            </tbody>
          </table>
        </div>






        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
