import React, { useState } from 'react';
import * as XLSX from 'xlsx'; // Make sure to install xlsx package

const RecordTracker = () => {
  const [salesData, setSalesData] = useState([
    {
      id: 1,
      month: 'January',
      orgName: 'Company A',
      gstNumber: 'GST123456',
      state: 'State A',
      stateCode: 'SA',
      invoiceDate: '2024-01-15',
      invoiceNumber: 'INV001',
      taxableValue: 1000,
      cgst: 90,
      sgst: 90,
      igst: 0,
      totalGst: 180,
      invoiceSubtotal: 1180,
      dueDate: '2024-01-30',
      paymentStatus: 'Paid',
      receivedDate: '2024-01-25',
      tdsPercentage: 0,
      tdsDeducted: 0,
      amountReceived: 1180,
      balancePayment: 0,
      paymentRemarks: 'Full payment received',
    },
    {
      id: 2,
      month: 'February',
      orgName: 'Company B',
      gstNumber: 'GST654321',
      state: 'State B',
      stateCode: 'SB',
      invoiceDate: '2024-02-10',
      invoiceNumber: 'INV002',
      taxableValue: 1500,
      cgst: 135,
      sgst: 135,
      igst: 0,
      totalGst: 270,
      invoiceSubtotal: 1770,
      dueDate: '2024-02-25',
      paymentStatus: 'Pending',
      receivedDate: null,
      tdsPercentage: 0,
      tdsDeducted: 0,
      amountReceived: 0,
      balancePayment: 1770,
      paymentRemarks: 'Pending payment',
    },
    {
      id: 3,
      month: 'March',
      orgName: 'Company C',
      gstNumber: 'GST789012',
      state: 'State C',
      stateCode: 'SC',
      invoiceDate: '2024-03-05',
      invoiceNumber: 'INV003',
      taxableValue: 2000,
      cgst: 180,
      sgst: 180,
      igst: 0,
      totalGst: 360,
      invoiceSubtotal: 2360,
      dueDate: '2024-03-20',
      paymentStatus: 'Paid',
      receivedDate: '2024-03-15',
      tdsPercentage: 0,
      tdsDeducted: 0,
      amountReceived: 2360,
      balancePayment: 0,
      paymentRemarks: 'Full payment received',
    },
  ]);

  const [newSale, setNewSale] = useState({ month: '', orgName: '', taxableValue: '', invoiceSubtotal: '', paymentStatus: '' });
  const [filteredData, setFilteredData] = useState(salesData); // State to hold filtered data
  const [noValuesMatched, setNoValuesMatched] = useState(false); // State to track if no values matched

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSale({ ...newSale, [name]: value });
  };

  const handleAddSale = () => {
    setSalesData([...salesData, { id: salesData.length + 1, ...newSale }]);
    setNewSale({ month: '', orgName: '', taxableValue: '', invoiceSubtotal: '', paymentStatus: '' });
  };

  const handleSearch = () => {
    const { month, orgName, taxableValue, invoiceSubtotal, paymentStatus } = newSale;

    const filtered = salesData.filter(sale => {
      return (
        (month ? sale.month === month : true) &&
        (orgName ? sale.orgName.toLowerCase().includes(orgName.toLowerCase()) : true) &&
        (taxableValue ? sale.taxableValue === Number(taxableValue) : true) &&
        (invoiceSubtotal ? sale.invoiceSubtotal === Number(invoiceSubtotal) : true) &&
        (paymentStatus ? sale.paymentStatus === paymentStatus : true)
      );
    });

    setFilteredData(filtered);
    setNoValuesMatched(filtered.length === 0); // Update state for no matches
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(salesData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');
    XLSX.writeFile(workbook, 'SalesData.xlsx');
  };

  return (
    <div className="w-full bg-[#c1dff2] border overflow-hidden">
<h2 className="text-2xl font-bold py-3 text-left text-[#4d606b] px-3 border">RECORDS & TRACKERS</h2>
      <div className="space-y-4 py-[30px] px-[51px] bg-white">
        {/* Filter Options */}
        <div className="flex space-x-4 mb-4">
          <select className="border p-2" name="month" onChange={handleInputChange}>
            <option value="">Select Month</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
          </select>
          <input
            className="border p-2"
            type="text"
            name="orgName"
            placeholder="Organisation Name"
            onChange={handleInputChange}
          />
          <input
            className="border p-2"
            type="number"
            name="taxableValue"
            placeholder="Taxable Value"
            onChange={handleInputChange}
          />
          <input
            className="border p-2"
            type="number"
            name="invoiceSubtotal"
            placeholder="Invoice Subtotal"
            onChange={handleInputChange}
          />
          <select className="border p-2" name="paymentStatus" onChange={handleInputChange}>
            <option value="">Payment Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <button onClick={handleSearch} className="bg-[#2c81ba] text-white p-2">Search</button>
        </div>

        <div className=" overflow-scroll">
          <table className="min-w-full border-collapse border   overflow-scroll" id="table_invoice">
            <thead className="">
              <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b] ">
                <th className="border  px-4 py-2">Sl</th>
                <th className="border  px-4 py-2">Month</th>
                <th className="border  px-4 py-2">Organization Name</th>
                <th className="border  px-4 py-2">GST Number</th>
                <th className="border  px-4 py-2">State</th>
                <th className="border  px-4 py-2">State Code</th>
                <th className="border  px-4 py-2">Invoice Date</th>
                <th className="border  px-4 py-2">Invoice Number</th>
                <th className="border  px-4 py-2">Taxable Value</th>
                <th className="border  px-4 py-2">CGST</th>
                <th className="border  px-4 py-2">SGST</th>
                <th className="border  px-4 py-2">IGST</th>
                <th className="border  px-4 py-2">Total GST</th>
                <th className="border  px-4 py-2">Invoice Subtotal</th>
                <th className="border  px-4 py-2">Due Date</th>
                <th className="border  px-4 py-2">Payment Status</th>
                <th className="border  px-4 py-2">Received Date</th>
                <th className="border  px-4 py-2">TDS Percentage</th>
                <th className="border  px-4 py-2">TDS Deducted</th>
                <th className="border  px-4 py-2">Amount Received</th>
                <th className="border  px-4 py-2">Balance Payment</th>
                <th className="border  px-4 py-2">Payment Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((sale, index) => (
                  <tr key={sale.id} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                    <td className="border  px-4 py-2">{sale.id}</td>
                    <td className="border  px-4 py-2">{sale.month}</td>
                    <td className="border  px-4 py-2">{sale.orgName}</td>
                    <td className="border  px-4 py-2">{sale.gstNumber}</td>
                    <td className="border  px-4 py-2">{sale.state}</td>
                    <td className="border  px-4 py-2">{sale.stateCode}</td>
                    <td className="border  px-4 py-2">{sale.invoiceDate}</td>
                    <td className="border  px-4 py-2">{sale.invoiceNumber}</td>
                    <td className="border  px-4 py-2">{sale.taxableValue}</td>
                    <td className="border  px-4 py-2">{sale.cgst}</td>
                    <td className="border  px-4 py-2">{sale.sgst}</td>
                    <td className="border  px-4 py-2">{sale.igst}</td>
                    <td className="border  px-4 py-2">{sale.totalGst}</td>
                    <td className="border  px-4 py-2">{sale.invoiceSubtotal}</td>
                    <td className="border  px-4 py-2">{sale.dueDate}</td>
                    <td className="border  px-4 py-2">{sale.paymentStatus}</td>
                    <td className="border  px-4 py-2">{sale.receivedDate}</td>
                    <td className="border  px-4 py-2">{sale.tdsPercentage}</td>
                    <td className="border  px-4 py-2">{sale.tdsDeducted}</td>
                    <td className="border  px-4 py-2">{sale.amountReceived}</td>
                    <td className="border  px-4 py-2">{sale.balancePayment}</td>
                    <td className="border  px-4 py-2">{sale.paymentRemarks}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="21" className="border  px-4 py-2 text-center text-red-600">
                    {noValuesMatched ? "No results matched your search criteria." : "No data available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button onClick={downloadExcel} className="bg-green-500 text-white p-2">Download Excel</button>
      </div>
    </div>
  );
};

export default RecordTracker;
