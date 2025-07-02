
    const [data, setData] = useState([]);

        const paginatedData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

     const filteredData = paginatedData.filter((data) =>
        data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.client_spoc_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.status.toLowerCase().includes(searchTerm.toLowerCase())

    );
  
  {filteredData.map((data, index) => {
                                        const isDownloadable = data.overall_status === "completed" && data.is_verify === "yes" || data.is_verify === "no";
                                        return (


                                            <React.Fragment key={data.id}>
                                                <tr
                                                    className={`text-center ${data.is_highlight === 1 ? 'highlight' : ''}`}
                                                    style={{
                                                        borderColor: data.is_highlight === 1 ? 'yellow' : 'transparent',
                                                    }}
                                                >
                                                    <td className="border border-black px-4 py-2">
                                                        {(() => {
                                                            let buttonText = "";
                                                            let buttonDisabled = false;

                                                            if (data.overall_status === "completed") {
                                                                if (data.is_verify === "yes") {
                                                                    buttonText = "DOWNLOAD";
                                                                } else {
                                                                    buttonText = "QC Pending";
                                                                }

                                                                /*
                                                                else {
                                                                    buttonText = "NOT READY";
                                                                    buttonDisabled = true;
                                                                }
                                                                */
                                                            } else {
                                                                buttonText = "NOT READY";
                                                                buttonDisabled = true;
                                                            }

                                                            return buttonDisabled ? (
                                                                <button
                                                                    className="bg-gray-500 text-white px-4 py-2 rounded cursor-not-allowed"
                                                                    disabled
                                                                >
                                                                    {buttonText}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleDownload(index)}
                                                                    disabled={downloadingIndex}
                                                                    className={`bg-green-500 hover:scale-105 uppercase border border-white hover:border-whit text-white px-4 py-2 rounded hover:bg-green-300  ${downloadingIndex === index ? "opacity-50 cursor-not-allowed " : ""
                                                                        }`}
                                                                >
                                                                    {downloadingIndex === index ? (
                                                                        <span className="flex items-center gap-2">
                                                                            <svg
                                                                                className="animate-spin h-5 w-5 text-white hover:text-green-500"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                            >
                                                                                <circle
                                                                                    className="opacity-25"
                                                                                    cx="12"
                                                                                    cy="12"
                                                                                    r="10"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="4"
                                                                                ></circle>
                                                                                <path
                                                                                    className="opacity-75"
                                                                                    fill="currentColor"
                                                                                    d="M4 12a8 8 0 018-8v8H4z"
                                                                                ></path>
                                                                            </svg>
                                                                            Downloading...
                                                                        </span>
                                                                    ) : (
                                                                        buttonText
                                                                    )}
                                                                </button>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>

                                            </React.Fragment>
                                        )
                                    })}