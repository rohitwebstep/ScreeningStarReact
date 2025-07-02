import { useState } from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root');

export default function ConsentPopup() {
  const [isOpen, setIsOpen] = useState(true);

  const closeModal = () => setIsOpen(false);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel="Consent Popup"
      className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl mx-auto mt-20"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <h2 className="text-xl font-semibold mb-4">Dear Applicant Name VANSHH</h2>
      <h3 className="text-lg font-medium mb-4">Greetings from Screeningstar Team,</h3>
      <p className="mb-4">You have been invited to complete an online background verification form on behalf of Viyal Technologies Private Limited.</p>
      <h4 className="font-bold mb-2">Note:</h4>
      <ul className="list-disc pl-5 space-y-2 text-gray-600">
        <li>
          Please provide the consent as “I hereby authorize Screeningstar Solutions Private Limited and its representative to verify information provided in my application for employment and this employee background verification form, and to conduct enquiries as may be necessary, at the company’s discretion. I authorize all persons who may have information relevant to this enquiry to disclose it to Screeningstar Solutions Private Limited or its representative. I release all persons from liability on account of such disclosure”. I confirm that the above information is correct to the best of my knowledge. I agree that in the event of my obtaining employment, my probationary appointment, confirmation as well as continued employment in the services of the company are subject to clearance of medical test and background verification check done by the company.
        </li>
        <li>Data is used for employment verification purposes only.</li>
        <li>In case of further queries, please contact the HR of your Organisation.</li>
      </ul>
      <div className="flex justify-end gap-4 mt-6">
        <button onClick={closeModal} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md">Close</button>
        <button onClick={closeModal} className="px-4 py-2 bg-blue-600 text-white rounded-md">Proceed</button>
      </div>
    </Modal>
  );
}