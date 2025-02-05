import React from 'react'

const Form2 = () => {
    return (
        <div>
            <div className='permanentaddress '>
                permanent address
                <form className="space-y-4 py-[30px] px-[51px] bg-white rounded-md" id="address-form">
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


                </form>
            </div>
            <div className='currentaddress '>
                <div>Currwent address </div>
                <div class="addresses border border-[#3e76a5] p-5 mb-5 rounded-md">
                    <div class="grid grid-cols-1 gap-4">

                        <div class="flex flex-col">
                            <label for="ca_full_address" class="mb-1 text-sm font-semibold">Full Address</label>
                            <input
                                type="text"
                                class="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
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
            <div className='SelectedServices '>
                <h1 className='text-center text-2xl'> SELECTED SERVICES </h1>
                <div class="servdesc flex flex-col mb-4">
                    <label for="sta__police_verification_pa" class="mb-1 text-sm font-semibold">POLICE VERIFICATION PA</label>
                    <select
                        id="sta__police_verification_pa"
                        name="sta__police_verification_pa"
                        class="w-full rounded-md p-2.5 border bg-[#f7f6fb] text-[#a5a3af] border-gray-300"
                        required
                    >
                        <option disabled selected>--Select status (police_verification_pa)--</option>
                        <option value="initiated" data-sname="police-verification-pa">INITIATED</option>
                        <option value="hold" data-sname="police-verification-pa">HOLD</option>
                        <option value="closure advice" data-sname="police-verification-pa">CLOSURE ADVICE</option>
                        <option value="wip" data-sname="police-verification-pa">WIP</option>
                        <option value="insuff" data-sname="police-verification-pa">INSUFF</option>
                        <option value="completed" data-sname="police-verification-pa">COMPLETED</option>
                        <option value="stopcheck" data-sname="police-verification-pa">STOPCHECK</option>
                        <option value="active employment" data-sname="police-verification-pa">ACTIVE EMPLOYMENT</option>
                        <option value="nil" data-sname="police-verification-pa">NIL</option>
                        <option value="not doable" data-sname="police-verification-pa">NOT DOABLE</option>
                        <option value="candidate denied" data-sname="police-verification-pa">CANDIDATE DENIED</option>
                        <option value="completed_green" selected data-sname="police-verification-pa">COMPLETED GREEN</option>
                        <option value="completed_orange" data-sname="police-verification-pa">COMPLETED ORANGE</option>
                        <option value="completed_red" data-sname="police-verification-pa">COMPLETED RED</option>
                        <option value="completed_yellow" data-sname="police-verification-pa">COMPLETED YELLOW</option>
                        <option value="completed_pink" data-sname="police-verification-pa">COMPLETED PINK</option>
                    </select>
                </div>
                <div class="servdesc flex flex-col mb-4">
                    <label for="sta__post_graduation" class="mb-1 text-sm font-semibold">POST GRADUATION</label>
                    <select
                        id="sta__post_graduation"
                        name="sta__post_graduation"
                        class="w-full rounded-md p-2.5 border bg-[#f7f6fb] text-[#a5a3af] border-gray-300"
                        required
                    >
                        <option disabled selected>--Select status (post_graduation)--</option>
                        <option value="initiated" selected data-sname="post-graduation">INITIATED</option>
                        <option value="hold" data-sname="post-graduation">HOLD</option>
                        <option value="closure advice" data-sname="post-graduation">CLOSURE ADVICE</option>
                        <option value="wip" data-sname="post-graduation">WIP</option>
                        <option value="insuff" data-sname="post-graduation">INSUFF</option>
                        <option value="completed" data-sname="post-graduation">COMPLETED</option>
                        <option value="stopcheck" data-sname="post-graduation">STOPCHECK</option>
                        <option value="active employment" data-sname="post-graduation">ACTIVE EMPLOYMENT</option>
                        <option value="nil" data-sname="post-graduation">NIL</option>
                        <option value="not doable" data-sname="post-graduation">NOT DOABLE</option>
                        <option value="candidate denied" data-sname="post-graduation">CANDIDATE DENIED</option>
                        <option value="completed_green" data-sname="post-graduation">COMPLETED GREEN</option>
                        <option value="completed_orange" data-sname="post-graduation">COMPLETED ORANGE</option>
                        <option value="completed_red" data-sname="post-graduation">COMPLETED RED</option>
                        <option value="completed_yellow" data-sname="post-graduation">COMPLETED YELLOW</option>
                        <option value="completed_pink" data-sname="post-graduation">COMPLETED PINK</option>
                    </select>
                </div>
                <div class="servdesc flex flex-col mb-4">
                    <label for="sta__graduation" class="mb-1 text-sm font-semibold">GRADUATION</label>
                    <select
                        id="sta__graduation"
                        name="sta__graduation"
                        class="w-full rounded-md p-2.5 border bg-[#f7f6fb] text-[#a5a3af] border-gray-300"
                        required
                    >
                        <option disabled selected>--Select status (graduation)--</option>
                        <option value="initiated" selected data-sname="graduation">INITIATED</option>
                        <option value="hold" data-sname="graduation">HOLD</option>
                        <option value="closure advice" data-sname="graduation">CLOSURE ADVICE</option>
                        <option value="wip" data-sname="graduation">WIP</option>
                        <option value="insuff" data-sname="graduation">INSUFF</option>
                        <option value="completed" data-sname="graduation">COMPLETED</option>
                        <option value="stopcheck" data-sname="graduation">STOPCHECK</option>
                        <option value="active employment" data-sname="graduation">ACTIVE EMPLOYMENT</option>
                        <option value="nil" data-sname="graduation">NIL</option>
                        <option value="not doable" data-sname="graduation">NOT DOABLE</option>
                        <option value="candidate denied" data-sname="graduation">CANDIDATE DENIED</option>
                        <option value="completed_green" data-sname="graduation">COMPLETED GREEN</option>
                        <option value="completed_orange" data-sname="graduation">COMPLETED ORANGE</option>
                        <option value="completed_red" data-sname="graduation">COMPLETED RED</option>
                        <option value="completed_yellow" data-sname="graduation">COMPLETED YELLOW</option>
                        <option value="completed_pink" data-sname="graduation">COMPLETED PINK</option>
                    </select>
                </div>



            </div>
            <div className='ReportGeneration'>
                <div className="bck_verify">
                    <table className="min-w-full border-collapse border border-black rounded-lg">
                        <thead className="bg-[#ed8f1c] text-white">
                            <tr>
                                <th colSpan="3" className="border border-black px-4 py-2 text-center">
                                    POLICE VERIFICATION PA
                                </th>
                            </tr>
                            <tr>
                                <th className="border border-black px-4 py-2">PARTICULARS</th>
                                <th className="border border-black px-4 py-2">APPLICANT DETAILS</th>
                                <th className="border border-black px-4 py-2">VERIFIED DETAILS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black px-4 py-2">Name Of The Applicant</td>
                                <td colSpan="2" className="border border-black px-4 py-2">
                                    <input
                                        type="text"
                                        name="police_verification_pa___pvpana"
                                        id="pvpana"
                                        defaultValue="Pooja Mishra"
                                        className="form-control"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black px-4 py-2">Date Of Birth</td>
                                <td colSpan="2" className="border border-black px-4 py-2">
                                    <input
                                        type="text"
                                        name="police_verification_pa___pvpadob"
                                        id="pvpadob"
                                        defaultValue="14-04-2001"
                                        className="form-control"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black px-4 py-2">Full Address</td>
                                <td colSpan="2" className="border border-black px-4 py-2">
                                    <input
                                        type="text"
                                        name="police_verification_pa___pvpafull"
                                        id="pvpafull"
                                        defaultValue="D/O Ramesh Chandra Mishra, C-76 Harihar Nagar Dk Marriage Lawn Lucknow Up-226010"
                                        className="form-control"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black px-4 py-2">Information Source</td>
                                <td colSpan="2" className="border border-black px-4 py-2">
                                    <input
                                        type="text"
                                        name="police_verification_pa___pvpais"
                                        id="pvpais"
                                        defaultValue="SHO - Karan Raj Verma, Constable"
                                        className="form-control"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black px-4 py-2">Date Of Verification</td>
                                <td colSpan="2" className="border border-black px-4 py-2">
                                    <input
                                        type="text"
                                        name="police_verification_pa___pvpadov"
                                        id="pvpadov"
                                        defaultValue="27-09-2024"
                                        className="form-control"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black px-4 py-2">Colour Code</td>
                                <td colSpan="2" className="border border-black px-4 py-2">
                                    <select
                                        className="selectcolorOption border border-black px-4 py-2"
                                        name="police_verification_pa___pvpacc"
                                        id="pvpacc"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Colour</option>
                                        <option value="green" selected>GREEN</option>
                                        <option value="red">RED</option>
                                        <option value="yellow">YELLOW</option>
                                        <option value="orange">ORANGE</option>
                                        <option value="pink">PINK</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black px-4 py-2">Additional Fee</td>
                                <td colSpan="2" className="border border-black px-4 py-2">
                                    <input
                                        type="text"
                                        onKeyPress={(e) => /[0-9]/i.test(e.key)}
                                        className="form-control"
                                        name="police_verification_pa___add_fee"
                                        id="police_verification_pa___add_feepolice-verification-pa"
                                        defaultValue=""
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black px-4 py-2">Remarks</td>
                                <td colSpan="2" className="border border-black px-4 py-2">
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="police_verification_pa___rmk"
                                        id="rmkpolice_verification_pa"
                                        defaultValue="The Annexure includes the Police Verification report, duly stamped and signed by the Advocate, noting that no criminal record was found."
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black px-4 py-2">
                                    Annexure <span className="text-red-500">*</span>
                                </td>
                                <td colSpan="2" className="border border-black px-4 py-2">

                                    <input
                                        type="file"
                                        className="form-control annexureReq anexmul mc-input"
                                        name="filepolice_verification_pa[]"

                                        data-annul="police_verification_pa"
                                        id="filepolice_verification_pa"
                                        multiple
                                    />
                                    <p className="error text-danger"></p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <input type="hidden" name="lcntinpolice-verification-pa" value="" />
                    <input type="hidden" name="filcnttpolice-verification-pa" id="filcnttpolice-verification-pa" value="" />
                </div>
            </div>




        </div>
    )
}

export default Form2
