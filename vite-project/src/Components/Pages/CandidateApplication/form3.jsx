import React from 'react'

const Form3 = () => {
    return (
        <div>
            <form className="space-y-4 py-[30px] px-[51px] bg-white rounded-md" id="insufficiency-remarks">
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="firstLevelRemarks" className="mb-1 text-sm font-semibold">First Level Insufficiency Remarks:</label>
                        <input
                            type="text"
                            name="firstLevelRemarks"
                            id="firstLevelRemarks"
                            placeholder="Enter remarks"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="firstInsuffRaisedDate" className="mb-1 text-sm font-semibold">First Insuff Raised Date:</label>
                        <input
                            type="date"
                            name="firstInsuffRaisedDate"
                            id="firstInsuffRaisedDate"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="firstInsuffClearedDate" className="mb-1 text-sm font-semibold">First Insuff Cleared Date / Re-Opened date:</label>
                        <input
                            type="date"
                            name="firstInsuffClearedDate"
                            id="firstInsuffClearedDate"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="secondLevelRemarks" className="mb-1 text-sm font-semibold">Second Level Insufficiency Remarks:</label>
                        <input
                            type="text"
                            name="secondLevelRemarks"
                            id="secondLevelRemarks"
                            placeholder="Enter remarks"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="secondInsuffRaisedDate" className="mb-1 text-sm font-semibold">Second Insuff Raised Date:</label>
                        <input
                            type="date"
                            name="secondInsuffRaisedDate"
                            id="secondInsuffRaisedDate"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="secondInsuffClearedDate" className="mb-1 text-sm font-semibold">Second Insuff Cleared Date / Re-Opened date:</label>
                        <input
                            type="date"
                            name="secondInsuffClearedDate"
                            id="secondInsuffClearedDate"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="thirdLevelRemarks" className="mb-1 text-sm font-semibold">Third Level Insufficiency Remarks:</label>
                        <input
                            type="text"
                            name="thirdLevelRemarks"
                            id="thirdLevelRemarks"
                            placeholder="Enter remarks"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="thirdInsuffRaisedDate" className="mb-1 text-sm font-semibold">Third Insuff Raised Date:</label>
                        <input
                            type="date"
                            name="thirdInsuffRaisedDate"
                            id="thirdInsuffRaisedDate"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="thirdInsuffClearedDate" className="mb-1 text-sm font-semibold">Third Insuff Cleared Date / Re-Opened date:</label>
                        <input
                            type="date"
                            name="thirdInsuffClearedDate"
                            id="thirdInsuffClearedDate"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="overallStatus" className="mb-1 text-sm font-semibold">Overall Status*:</label>
                        <select
                            name="overallStatus"
                            id="overallStatus"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                            required
                        >
                            <option value="">Select an option</option>
                            <option value="option1">Option 1</option>
                            <option value="option2">Option 2</option>
                            <option value="option3">Option 3</option>
                            <option value="option4">Option 4</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="reportDate" className="mb-1 text-sm font-semibold">Report Date:</label>
                        <input
                            type="date"
                            name="reportDate"
                            id="reportDate"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="reportStatus" className="mb-1 text-sm font-semibold">Report Status:</label>
                        <select
                            name="reportStatus"
                            id="reportStatus"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        >
                            <option value="">Select an option</option>
                            <option value="status1">Status 1</option>
                            <option value="status2">Status 2</option>
                            <option value="status3">Status 3</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="reportType" className="mb-1 text-sm font-semibold">Report Type:</label>
                        <select
                            name="reportType"
                            id="reportType"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        >
                            <option value="">Select an option</option>
                            <option value="type1">Type 1</option>
                            <option value="type2">Type 2</option>
                            <option value="type3">Type 3</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="verificationStatus" className="mb-1 text-sm font-semibold">Final Verification Status:</label>
                        <select
                            name="verificationStatus"
                            id="verificationStatus"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        >
                            <option value="">Select an option</option>
                            <option value="status1">Status 1</option>
                            <option value="status2">Status 2</option>
                            <option value="status3">Status 3</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="qualityTeamVerification" className="mb-1 text-sm font-semibold">Is verified by quality team?</label>
                        <select
                            name="qualityTeamVerification"
                            id="qualityTeamVerification"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        >
                            <option value="">Select an option</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="remarks" className="mb-1 text-sm font-semibold">Additional Remarks:</label>
                        <textarea
                            name="remarks"
                            id="remarks"
                            rows="4"
                            placeholder="Enter any additional remarks here"
                            className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        ></textarea>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div className="">
                        <input
                            type="checkbox"
                            name="reportDate"
                            id="reportDate"
                            className=" align-middle mr-4 rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        />
                        <label htmlFor="reportDate" className="mb-1 text-sm font-semibold">Not Mandatory Fields</label>

                    </div>
                </div>
            </form>

        </div>
    )
}

export default Form3
