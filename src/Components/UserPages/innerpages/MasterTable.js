import React, { useState } from 'react';

const DataTable = () => {
  const [searchCaseReceived, setSearchCaseReceived] = useState('');
  const [searchInsufficiency, setSearchInsufficiency] = useState('');
  
  const [currentPageCaseReceived, setCurrentPageCaseReceived] = useState(1);
  const [currentPageInsufficiency, setCurrentPageInsufficiency] = useState(1);
  const entriesPerPage = 5;

  const caseReceivedData = [
    { no: 1, referenceId: 'SS-NTIPL-2', empCode: 'NA', empName: 'Bandaru Lakshmi Haarika' },
    { no: 2, referenceId: 'SS-NTIPL-1', empCode: 'NA', empName: 'Sumith O Naik' },
    { no: 3, referenceId: 'SS-NTIPL-3', empCode: 'NA', empName: 'John Doe' },
    { no: 4, referenceId: 'SS-NTIPL-4', empCode: 'NA', empName: 'Jane Smith' },
    { no: 5, referenceId: 'SS-NTIPL-5', empCode: 'NA', empName: 'Emily Davis' },
    { no: 6, referenceId: 'SS-NTIPL-6', empCode: 'NA', empName: 'Michael Brown' },
  ];

  const insufficiencyData = []; // Assuming this data comes from an API or state

  // Filter logic
  const filteredCaseReceived = caseReceivedData.filter(item =>
    item.referenceId.toLowerCase().includes(searchCaseReceived.toLowerCase()) ||
    item.empName.toLowerCase().includes(searchCaseReceived.toLowerCase())
  );

  const filteredInsufficiency = insufficiencyData.filter(item =>
    item.referenceId.toLowerCase().includes(searchInsufficiency.toLowerCase()) ||
    item.empName.toLowerCase().includes(searchInsufficiency.toLowerCase())
  );

  // Pagination logic
  const indexOfLastCaseReceived = currentPageCaseReceived * entriesPerPage;
  const indexOfFirstCaseReceived = indexOfLastCaseReceived - entriesPerPage;
  const currentCaseReceivedData = filteredCaseReceived.slice(indexOfFirstCaseReceived, indexOfLastCaseReceived);

  const indexOfLastInsufficiency = currentPageInsufficiency * entriesPerPage;
  const indexOfFirstInsufficiency = indexOfLastInsufficiency - entriesPerPage;
  const currentInsufficiencyData = filteredInsufficiency.slice(indexOfFirstInsufficiency, indexOfLastInsufficiency);

  // Handle pagination change
  const handleCaseReceivedPageChange = (pageNumber) => {
    setCurrentPageCaseReceived(pageNumber);
  };

  const handleInsufficiencyPageChange = (pageNumber) => {
    setCurrentPageInsufficiency(pageNumber);
  };

  // Calculate total pages
  const totalCaseReceivedPages = Math.ceil(filteredCaseReceived.length / entriesPerPage);
  const totalInsufficiencyPages = Math.ceil(filteredInsufficiency.length / entriesPerPage);

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {/* CASE RECEIVED Table */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2">CASE RECEIVED</h2>
          <div className="flex mb-4">
            <input
              type="text"
              placeholder="Search..."
              className="border rounded px-2 py-1 w-full"
              value={searchCaseReceived}
              onChange={(e) => setSearchCaseReceived(e.target.value)}
            />
          </div>
          <table className="min-w-full border-collapse border  rounded-lg">
            <thead>
              <tr className='bg-[#c1dff2] text-[#4d606b]'>
                <th className="border  px-4 py-2">NO</th>
                <th className="border  px-4 py-2">REFERENCE ID</th>
                <th className="border  px-4 py-2">EMP CODE</th>
                <th className="border  px-4 py-2">EMP NAME</th>
              </tr>
            </thead>
            <tbody>
              {currentCaseReceivedData.length > 0 ? (
                currentCaseReceivedData.map(item => (
                  <tr key={item.no}>
                    <td className="border  px-4 py-2">{item.no}</td>
                    <td className="border  px-4 py-2">{item.referenceId}</td>
                    <td className="border  px-4 py-2">{item.empCode}</td>
                    <td className="border  px-4 py-2">{item.empName}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="border  px-4 py-2 text-center">No data available</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination for CASE RECEIVED */}
          <div className="flex justify-between mt-4">
            <button 
              onClick={() => handleCaseReceivedPageChange(currentPageCaseReceived - 1)}
              disabled={currentPageCaseReceived === 1}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">
              Previous
            </button>
            <span>{currentPageCaseReceived} of {totalCaseReceivedPages}</span>
            <button 
              onClick={() => handleCaseReceivedPageChange(currentPageCaseReceived + 1)}
              disabled={currentPageCaseReceived === totalCaseReceivedPages}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">
              Next
            </button>
          </div>
        </div>

        {/* INSUFFICIENCY Table */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2">INSUFFICIENCY</h2>
          <div className="flex mb-4">
            <input
              type="text"
              placeholder="Search..."
              className="border rounded px-2 py-1 w-full"
              value={searchInsufficiency}
              onChange={(e) => setSearchInsufficiency(e.target.value)}
            />
          </div>
          <table className="min-w-full border-collapse border  rounded-lg">
            <thead>
              <tr className='bg-[#c1dff2] text-[#4d606b]'>
                <th className="border  px-4 py-2">NO</th>
                <th className="border  px-4 py-2">REFERENCE ID</th>
                <th className="border  px-4 py-2">EMP CODE</th>
                <th className="border  px-4 py-2">EMP NAME</th>
              </tr>
            </thead>
            <tbody>
              {currentInsufficiencyData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="border  px-4 py-2 text-center">No data available in table</td>
                </tr>
              ) : (
                currentInsufficiencyData.map(item => (
                  <tr key={item.no}>
                    <td className="border  px-4 py-2">{item.no}</td>
                    <td className="border  px-4 py-2">{item.referenceId}</td>
                    <td className="border  px-4 py-2">{item.empCode}</td>
                    <td className="border  px-4 py-2">{item.empName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination for INSUFFICIENCY */}
          <div className="flex justify-between mt-4">
            <button 
              onClick={() => handleInsufficiencyPageChange(currentPageInsufficiency - 1)}
              disabled={currentPageInsufficiency === 1}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">
              Previous
            </button>
            <span>{currentPageInsufficiency} of {totalInsufficiencyPages}</span>
            <button 
              onClick={() => handleInsufficiencyPageChange(currentPageInsufficiency + 1)}
              disabled={currentPageInsufficiency === totalInsufficiencyPages}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
