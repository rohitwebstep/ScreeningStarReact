import { React, useState } from 'react'

const Form1 = () => {
  const [date, setDate] = useState('');
  const [inputType, setInputType] = useState('text');

  const handleFocus = () => {
    setInputType('date'); // Change to date input on focus
  };

  const handleBlur = () => {
    if (!date) {
      setInputType('text'); // Change back to text if no date is selected
    }
  };
  return (
    <div className=" form start space-y-4 py-[30px] px-[51px] bg-white rounded-md" id="client-spoc">
    <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
            <label htmlFor="monthYear" className="mb-1 text-sm font-semibold">Month - Year*</label>
            <input
                type="text"
                name="monthYear"
                id="monthYear"
                placeholder="Month - Year*"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                required
            />
        </div>
        <div className="flex flex-col">
            <label htmlFor="initiationDate" className="mb-1 text-sm font-semibold">Inflation Date</label>
            <input
                type={inputType}
                name="initiationDate"
                id="initiationDate"
                placeholder={inputType === 'text' ? 'Inflation Date' : ''}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
            />
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="clientOrganization" className="mb-1 text-sm font-semibold">Name of the Client Organization</label>
            <input
                type="text"
                name="clientOrganization"
                id="clientOrganization"
                placeholder="Name of the Client Organization"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
            />
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="verificationPurpose" className="mb-1 text-sm font-semibold">Verification Purpose*</label>
            <input
                type="text"
                name="verificationPurpose"
                id="verificationPurpose"
                placeholder="Verification Purpose*"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                required
            />
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="applicantEmployeeID" className="mb-1 text-sm font-semibold">Applicant Employee ID</label>
            <input
                type="text"
                name="applicantEmployeeID"
                id="applicantEmployeeID"
                placeholder="Applicant Employee ID"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
            />
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="clientCode" className="mb-1 text-sm font-semibold">Client Code</label>
            <input
                type="text"
                name="clientCode"
                id="clientCode"
                placeholder="Client Code"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
            />
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="applicantName" className="mb-1 text-sm font-semibold">Name of the Applicant*</label>
            <input
                type="text"
                name="applicantName"
                id="applicantName"
                placeholder="Name of the Applicant*"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                required
            />
        </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
            <label htmlFor="contactNumber" className="mb-1 text-sm font-semibold">Contact Number</label>
            <input
                type="number"
                name="contactNumber"
                id="contactNumber"
                placeholder="Contact Number"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
            />
        </div>
        <div className="flex flex-col">
            <label htmlFor="contactNumber2" className="mb-1 text-sm font-semibold">Contact Number 2</label>
            <input
                type="number"
                name="contactNumber2"
                id="contactNumber2"
                placeholder="Contact Number 2"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
            />
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="fatherFullName" className="mb-1 text-sm font-semibold">Father Full Name</label>
            <input
                type="text"
                name="fatherFullName"
                id="fatherFullName"
                placeholder="Father Full Name"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
            />
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="dateOfBirth" className="mb-1 text-sm font-semibold">Date Of Birth</label>
            <input
                type={inputType}
                name="dateOfBirth"
                id="dateOfBirth"
                placeholder={inputType === 'text' ? 'Date Of Birth' : ''}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
            />
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="gender" className="mb-1 text-sm font-semibold">Gender</label>
            <select
                name="gender"
                id="gender"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] text-[#a5a3af] border-gray-300"
            >
                <option value="" disabled>Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="maritalStatus" className="mb-1 text-sm font-semibold">Marital Status</label>
            <select
                name="maritalStatus"
                id="maritalStatus"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] text-[#a5a3af] border-gray-300"
            >
                <option value="" disabled>Marital Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
            </select>
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="nationality" className="mb-1 text-sm font-semibold">Nationality</label>
            <input
                type="text"
                name="nationality"
                id="nationality"
                placeholder="Nationality"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
            />
        </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
            <label htmlFor="insuffClearedDate" className="mb-1 text-sm font-semibold">Insuff Cleared Date / Re-Opened Date*</label>
            <input
                type="date"
                name="insuffClearedDate"
                id="insuffClearedDate"
                placeholder="Insuff Cleared Date / Re-Opened Date*"
                className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                required
            />
        </div>
    </div>

    <div className='permanentaddress '>
        <div permanent address
            className="space-y-4 py-[30px]  border border-[#3e76a5] px-[51px] bg-white rounded-md" id="address-form"
        >
            <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col">
                    <label htmlFor="full_address" className="mb-1 text-sm font-semibold">Full Address*</label>
                    <input
                        type="text"
                        name="full_address"
                        id="full_address"
                        placeholder="Full Address*"
                        className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        required
                    />
                </div>
            </div>

            <h5 className="font-semibold text-lg">Period of Stay</h5>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label htmlFor="stay_from" className="mb-1 text-sm font-semibold">From:</label>
                    <input
                        type="text"
                        name="stay_from"
                        id="stay_from"
                        placeholder="From"
                        className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="stay_to" className="mb-1 text-sm font-semibold">To:</label>
                    <input
                        type="text"
                        name="stay_to"
                        id="stay_to"
                        placeholder="To"
                        className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col">
                    <label htmlFor="landmark" className="mb-1 text-sm font-semibold">Landmark:</label>
                    <input
                        type="text"
                        name="landmark"
                        id="landmark"
                        placeholder="Landmark"
                        className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col">
                    <label htmlFor="pin_code" className="mb-1 text-sm font-semibold">Pin Code:</label>
                    <input
                        type="number"
                        name="pin_code"
                        id="pin_code"
                        placeholder="Pin Code"
                        className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col">
                    <label htmlFor="state" className="mb-1 text-sm font-semibold">State:</label>
                    <input
                        type="text"
                        name="state"
                        id="state"
                        placeholder="State"
                        className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                    />
                </div>
            </div>


        </div>
    </div>
    <div className='currentaddress '>
        <div>Current address </div>
        <div class="addresses border border-[#3e76a5] p-5 mb-5 rounded-md">
            <div class="grid grid-cols-1 gap-4">

                <div class="flex flex-col">
                    <label for="ca_full_address" class="mb-1 text-sm font-semibold">Full Address</label>
                    <input
                        type="text"
                        class="w-full rounded-md mb-5 p-2.5 border bg-[#f7f6fb] border-gray-300"
                        name="ca_full_address"
                        id="ca_full_address"
                        placeholder="Full Address"
                    />
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4">

                <div class="flex flex-col">
                    <label for="ca_landmark" class="mb-1 text-sm font-semibold">Landmark</label>
                    <input
                        type="text"
                        class="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        name="ca_landmark"
                        id="ca_landmark"
                        placeholder="Landmark"
                    />
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4">

                <div class="flex flex-col">
                    <label for="ca_residence_mobile_no" class="mb-1 text-sm font-semibold">Residence Mobile No</label>
                    <input
                        type="number"
                        class="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        name="ca_residence_mobile_no"
                        id="ca_residence_mobile_no"
                        placeholder="Residence Mobile No"
                    />
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4">

                <div class="flex flex-col">
                    <label for="ca_state" class="mb-1 text-sm font-semibold">State</label>
                    <input
                        type="text"
                        class="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                        name="ca_state"
                        id="ca_state"
                        placeholder="State"
                    />
                </div>
            </div>
        </div>
    </div>
</div>
  )
}

export default Form1
