// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { CKEditor } from "@ckeditor/ckeditor5-react";
// import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

// const CkEditor = () => {
//   const [content, setContent] = useState("");
//   const navigate = useNavigate();

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <button onClick={() => navigate(-1)} className="mb-4 p-2 bg-blue-500 text-white rounded">Go Back</button>
//       <h2 className="text-xl font-bold mb-4">CKEditor Implementation</h2>
//       <CKEditor
//         editor={ClassicEditor}
//         data={content}
//         onChange={(event, editor) => setContent(editor.getData())}
//       />
//       <button onClick={() => console.log(content)} className="mt-4 p-2 bg-green-500 text-white rounded">
//         Save Content
//       </button>
//     </div>
//   );
// };

// export default CkEditor;
