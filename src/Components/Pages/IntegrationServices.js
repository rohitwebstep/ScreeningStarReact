import React, { useCallback, useRef, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';
// import "pdfjs-dist/build/pdf.worker.entry";
import {
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableCell,
    TableRow,
    AlignmentType,
    WidthType,
    Media,
    HeadingLevel,
    Document,
    ImageRun,
    BorderStyle
} from "docx";

import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import Default from "../../imgs/default.png"
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";

const InactiveClients = () => {
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [responseError, setResponseError] = useState(null);

    const [isUnblockLoading, setIsUnblockLoading] = useState(false);
    const navigate = useNavigate();
    const [inactiveClients, setInactiveClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const storedToken = localStorage.getItem('token');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeId, setActiveId] = useState(null);
    const formatDate = (date = new Date()) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200];
    const totalPages = Math.ceil(inactiveClients.length / entriesPerPage);

    const [selectedService, setSelectedService] = useState("");
    const [formData, setFormData] = useState({});
    const [courtExtraRows, setCourtExtraRows] = useState([]);
    const formRef = useRef(null);

    function addJustifiedText(doc, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let lines = [];
        words.forEach(word => {
            const testLine = line + word + ' ';
            const testWidth = doc.getTextWidth(testLine);
            if (testWidth > maxWidth && line !== '') {
                lines.push(line.trim());
                line = word + ' ';
            } else {
                line = testLine;
            }
        });
        lines.push(line.trim());

        lines.forEach((line, i) => {
            const lineWords = line.split(' ');
            if (lineWords.length === 1 || i === lines.length - 1) {
                // Last line: left-align
                doc.text(line, x, y + i * lineHeight);
            } else {
                // Justify this line
                const lineText = lineWords.join(' ');
                const textWidth = doc.getTextWidth(lineText);
                const spaceCount = lineWords.length - 1;
                const extraSpace = (maxWidth - textWidth) / spaceCount;
                let offsetX = x;

                lineWords.forEach((word, index) => {
                    doc.text(word, offsetX, y + i * lineHeight);
                    if (index < lineWords.length - 1) {
                        offsetX += doc.getTextWidth(word + ' ') + extraSpace;
                    }
                });
            }
        });
    }

    function navbar(doc) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const lineHeight = 5;

        // ---- IMAGE + | + ADVOCATE DETAILS ----
        const blockY = 2;
        const imgWidth = 35;
        const imgHeight = 35;
        const imgX = 20;

        const qrCodeBase64 = "https://webstepdev.com/screeningstarAssets/advocate.png";
        doc.addImage(qrCodeBase64, "PNG", imgX, blockY, imgWidth, imgHeight);

        // Vertical line next to image
        const lineX = pageWidth / 2;
        const blockHeight = imgHeight;

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(lineX, blockY + 5, lineX, blockY + blockHeight - 5);

        // Advocate Details
        const advocateDetails = [
            "NAVA NAYANA LEGAL CHEMBERS",
            "MANJUNATHA H S",
            "ADVOCATE, BBM, LLB",
            "ENROLL NO - KAR 4765/2023",
            "MOBILE NO: 9738812694",
            "MANJUNATH.9738812694@GMAIL.COM",
        ];

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const advocateX = pageWidth - 20;
        let advocateY = blockY + 5; // Start below top edge of image

        advocateDetails.forEach(line => {
            doc.text(line, advocateX, advocateY + 5, { align: 'right' });
            advocateY += lineHeight;
        });

        // Horizontal line under block
        const hrY = blockY + blockHeight + 5;
        doc.line(20, hrY - 2, pageWidth - 20, hrY - 2);

        // Return updated Y for next content
        return hrY + 10;
    }


    const handleServiceChange = (e) => {
        const service = e.target.value;

        setSelectedService(service);

        setFormData({
            selectedService: service,
            [service]: service === "court"
                ? { courtTable: [] }
                : {} // police has no table
        });
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        const currentService = formData.selectedService;

        setFormData((prev) => ({
            ...prev,
            [currentService]: {
                ...prev[currentService],
                [name]: value
            }
        }));
    };



    const handleRowChange = (index, fieldKey, value) => {
        const updatedRows = [...(formData.court?.courtTable || [])];

        updatedRows[index] = {
            ...updatedRows[index],
            [fieldKey]: value
        };

        setFormData((prev) => ({
            ...prev,
            court: {
                ...prev.court,
                courtTable: updatedRows
            }
        }));
    };



    const addRow = () => {
        const updatedRows = [...(formData.court?.courtTable || [])];

        if (updatedRows.length >= 15) {
            return; // Do nothing if limit reached
        }

        updatedRows.push({
            courtCheckType: "",
            jurisdiction: "",
            location: "",
            verificationResult: "",
        });

        setFormData((prev) => ({
            ...prev,
            court: {
                ...prev.court,
                courtTable: updatedRows,
            },
        }));
    };

    const removeRow = (indexToRemove) => {
        setFormData((prev) => {
            const updatedRows = [...(prev.court?.courtTable || [])];
            updatedRows.splice(indexToRemove, 1); // remove that specific row
            return {
                ...prev,
                court: {
                    ...prev.court,
                    courtTable: updatedRows,
                },
            };
        });
    };


    const policeFields = [
        "Reference ID",
        "Full Name",
        "Father's Name",
        "Date of Birth",
        "Address",
        "Name of the Police Station",
        "Locality / Jurisdiction",
        "Name of the Station House Officer",
        "Designation of the officer / SHO",
        "Phone Number of Police Station",
        "Number of Years covered in the station",
        "Date of Verification at Station",
        "Verification Status from Station",
        "Overall Track Records Status",
    ];

    const courtFields = [
        "Reference ID",
        "Full Name",
        "Father's Name",
        "Date of Birth",
        "Permanent Address",
        "Current Address",
        "Number of Years Search",
        "Date of Verification",
        "Verification Status",
    ];

    const noBorders = {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
    };

    const generatePolicePDF = async (policeData, shouldSave = true) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const lineHeight = 5;
        const marginLeft = 20;
        const marginRight = 20;
        const maxWidth = pageWidth - marginLeft - marginRight;
        // ---- IMAGE + | + ADVOCATE DETAILS ----
        const blockY = 2;
        const imgWidth = 35;
        const imgHeight = 35;
        const imgX = 20;

        const qrCodeBase64 = "https://webstepdev.com/screeningstarAssets/advocate.png";
        doc.addImage(qrCodeBase64, "PNG", imgX, blockY, imgWidth, imgHeight);

        // Draw vertical line next to image
        const lineX = pageWidth / 2;
        const blockHeight = imgHeight; // Enough for image + details

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(lineX, blockY + 5, lineX, blockY + blockHeight - 5);

        // Advocate Details
        const advocateX = pageWidth - 20;
        let advocateY = blockY;

        doc.setFontSize(10);
        const advocateDetails = [
               "NAVA NAYANA LEGAL CHEMBERS",
            "MANJUNATHA H S",
            "ADVOCATE, BBM, LLB",
            "ENROLL NO - KAR 4765/2023",
            "MOBILE NO: 9738812694",
            "MANJUNATH.9738812694@GMAIL.COM",
        ];

        advocateDetails.forEach(line => {
            doc.text(line, advocateX, advocateY + 10, { align: 'right' });
            advocateY += lineHeight;
        });


        // Horizontal line below the block
        const hrY = blockY + blockHeight + 5;
              doc.line(20, hrY - 2, pageWidth - 20, hrY - 2);


        let y = hrY + 7;

        // ---- TITLE ----
        doc.setFont('helvetica', 'bold'); // closest to semibold
        doc.setFontSize(15);
        doc.text('POLICE RECORD REPORT [LAW FIRM]', pageWidth / 2, y, { align: 'center' });

        y += lineHeight * 3 - 3;

        // ---- INTRO ----
        // ---- TITLE ----
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        const intro = `This is with regard to the search conducted in the Police Station referred below with regard to any criminal cases filed against the person detailed below.`;
        const introLines = doc.splitTextToSize(intro, pageWidth - 30);
        doc.text(introLines, 20, y - 6, { align: 'left' });
        y += introLines.length * lineHeight ;

        // ---- DATA TABLE ----
        doc.setFontSize(12);
        const colWidth = (pageWidth - 40) / 2;
        const rowHeight = lineHeight + 1;
        const tableX = 20;

        const entries = [
            ['Reference ID', policeData.reference_id || ''],
            ['Full Name', policeData.full_name || ''],
            ["Father's Name", policeData["father's_name"] || ''],
            ['Date of Birth', policeData.date_of_birth || ''],
            ['Address', policeData.address || ''],
            ['Name of the Police Station', policeData.name_of_the_police_station || ''],
            ['Locality / Jurisdiction', policeData["locality_/_jurisdiction"] || ''],
            ['Name of the Station House Officer', policeData.name_of_the_station_house_officer || ''],
            ['Designation of the officer / SHO', policeData["designation_of_the_officer_/_sho"] || ''],
            ['Phone Number of Police Station', policeData.phone_number_of_police_station || ''],
            ['Number of Years covered in the station', policeData.number_of_years_covered_in_the_station || ''],
            ['Date of Verification at Station', policeData.date_of_verification_at_station || ''],
            ['Verification Status from Station', policeData.verification_status_from_station || ''],
            ['Overall Track Records Status', policeData.overall_track_records_status || ''],
        ];
        doc.setLineWidth(0.1);
        const mymaxwidth = colWidth - 4;
        entries.forEach(([label, value]) => {
            const wrappedLabel = doc.splitTextToSize(label, mymaxwidth);
            const wrappedValue = doc.splitTextToSize(String(value), mymaxwidth);

            const linesCount = Math.max(wrappedLabel.length, wrappedValue.length);
            const dynamicRowHeight = linesCount * 7; // 7 is approx line height

            // Borders
            doc.rect(tableX, y - 6, colWidth, dynamicRowHeight);
            doc.rect(tableX + colWidth, y - 6, colWidth, dynamicRowHeight);

            // Text
            wrappedLabel.forEach((line, idx) => {
                doc.text(line, tableX + 2, y + (idx * 7));
            });

            wrappedValue.forEach((line, idx) => {
                doc.text(line, tableX + colWidth + 2, y + (idx * 7));
            });

            y += dynamicRowHeight;

            // Page break logic
            if (y > doc.internal.pageSize.getHeight() - 30) {
                doc.addPage();
                y = 20;
            }
        });

        // ---- DISCLAIMER ----
        y += 2;
        doc.setFontSize(12);
        const disclaimer = `The search results are based on the available registers maintained in respect of criminal case/s and suit registers in respect of civil case/s maintained in the above-mentioned Court / Police Station having jurisdiction over the address where the candidate was said to be residing. Due care has been taken in conducting the search. The records are public records and the search has been conducted on behalf of your good self and the undersigned is not responsible for any errors, inaccuracies, omissions or deletions if any in the said court or police records. The above report is based on the verbal confirmation of the concerned authority as on the date on which it is confirmed, hence this verification is subjective. Please do contact the Local Police for Candidate Police Clearance Certificate (PCC) / Police Verification Certificate.`;
        // adjust spacing after

        // 2. Main disclaimer paragraph
        doc.setFont('helvetica', 'normal');
        const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 40);
        // doc.text(disclaimerLines, 20, y, { align: 'left' });
        addJustifiedText(doc, disclaimer, 20, y, 170, 5); // x, y, maxWidth, lineHeight

        y += disclaimerLines.length * 5 + 6; // adjust y for next block
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DISCLAIMER', pageWidth / 2, y - 5, { align: 'center' });
        y += 1;
        // 3. 'Note:' block
        const noteLines = [
            [
                { text: 'Note:', bold: true },
                { text: ' This report is provided for informational purposes only and does not constitute an official police clearance or certificate.', bold: false },
            ],
            [
                { text: '', }
            ],
            [
                { text: '“Nava Nayana Legal Chambers”', bold: true },
                { text: ' does not guarantee the completeness, accuracy, or finality of the information and shall not be held liable for any decisions or actions taken by third parties based on this report.', bold: false },
            ],
            [
                { text: 'This document is confidential and intended solely for the authorized recipient. Any unauthorized use, reproduction, or dissemination is strictly prohibited without prior written consent.', bold: false },
            ],
        ];

        doc.setFontSize(12);

        const wordSpacing = 1.5; // adjust as needed

        noteLines.forEach(lineArray => {
            // If blank line, add vertical space
            if (lineArray.length === 1 && lineArray[0].text.trim() === '') {
                y += lineHeight - 4;
                return;
            }

            // Merge all parts into a single line string for splitting
            let lineText = '';
            let styleMap = [];

            lineArray.forEach(part => {
                const words = part.text.split(' ');
                words.forEach(word => {
                    styleMap.push({ word, bold: part.bold });
                });
            });

            // Build lines within maxWidth
            let lines = [];
            let currentLine = [];
            let currentWidth = 0;

            styleMap.forEach(item => {
                doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                const wordWidth = doc.getTextWidth(item.word + ' ');

                if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = [item];
                    currentWidth = wordWidth;
                } else {
                    currentLine.push(item);
                    currentWidth += wordWidth;
                }
            });
            if (currentLine.length) lines.push(currentLine);

            // Render each line
            lines.forEach((lineWords, index) => {
                let totalWordsWidth = 0;
                lineWords.forEach(item => {
                    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                    totalWordsWidth += doc.getTextWidth(item.word + ' ');
                });

                const gaps = lineWords.length - 1;
                let extraSpace = gaps > 0 ? (maxWidth - totalWordsWidth) / gaps : 0;

                // Don't justify last line
                if (index === lines.length - 1) extraSpace = 0;

                let x = marginLeft;

                lineWords.forEach((item, i) => {
                    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                    doc.text(item.word, x, y);

                    let wordWidth = doc.getTextWidth(item.word + ' ');
                    x += wordWidth;

                    if (i < lineWords.length - 1) {
                        x += extraSpace;
                    }
                });

                y += lineHeight;
            });
        });


        const qrCodeBase64w = "https://webstepdev.com/screeningstarAssets/stamp.png";
        doc.addImage(qrCodeBase64w, "PNG", imgX, y, 60, 25);

        if (shouldSave) {
            doc.save('Police_Record_Report.pdf');
        } else {
            return doc;
        }

    }
    const generateCourtPDF = async (courtData, shouldSave = true) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const lineHeight = 5;

        // ---- IMAGE + | + ADVOCATE DETAILS ----
        const blockY = 2;
        const imgWidth = 35;
        const imgHeight = 35;
        const imgX = 20;

        const qrCodeBase64 = "https://webstepdev.com/screeningstarAssets/advocate.png";
        doc.addImage(qrCodeBase64, "PNG", imgX, blockY, imgWidth, imgHeight);

        // Draw vertical line next to image
        const lineX = pageWidth / 2;
        const blockHeight = imgHeight; // Enough for image + details

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(lineX, blockY + 5, lineX, blockY + blockHeight - 5);

        // Advocate Details
        const advocateX = pageWidth - 20;
        let advocateY = blockY;

        doc.setFontSize(10);
        const advocateDetails = [
            // "MANJUNATHA H S",
            // "ADVOCATE, BBM, LLB",
            // "ENROLL NO - KAR (P) 4765/2023",
            // "MOBILE NO: 9738812694",
            // "MANJUNATH.9738812694@GMAIL.COM",
        ];

        advocateDetails.forEach(line => {
            doc.text(line, advocateX, advocateY + 10, { align: 'right' });
            advocateY += lineHeight;
        });

        // Horizontal line below the block
        const hrY = blockY + blockHeight + 5;
              doc.line(20, hrY - 2, pageWidth - 20, hrY - 2);


        let y = hrY + 7;

        // ---- TITLE ----
        doc.setFont('helvetica', 'bold'); // closest to semibold
        doc.setFontSize(15);
        doc.text('COURT RECORD REPORT', pageWidth / 2, y, { align: 'center' });

        y += lineHeight * 3 - 3;



        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        // Intro
        const intro = `This is with regard to the search conducted in the Police Station referred below with regard to any criminal cases filed against the person detailed below.`;
        const introLines = doc.splitTextToSize(intro, pageWidth - 30);
        doc.text(introLines, 20, y);
        y += introLines.length * lineHeight + 5;

        // === Civil Proceedings ===
        const civilTitle = 'Civil Proceedings:';
        const civilText = ' Original Suit / Miscellaneous Suit / Execution / Arbitration Cases before the Civil Court and High Court in its Original and Appellate Stage.';

        // Combine and split for wrapping
        const civilCombined = civilTitle + civilText;
        const civilLines = doc.splitTextToSize(civilCombined, pageWidth - 40);

        // First line: separate bold and normal
        const firstLine = civilLines[0];
        if (firstLine.startsWith(civilTitle)) {
            const normalPart = firstLine.slice(civilTitle.length);

            doc.setFont('helvetica', 'bold');
            doc.text(civilTitle, 20, y);

            const boldWidth = doc.getTextWidth(civilTitle);
            doc.setFont('helvetica', 'normal');
            doc.text(normalPart, 20 + boldWidth, y);
        } else {
            // fallback
            doc.setFont('helvetica', 'normal');
            doc.text(firstLine, 20, y);
        }

        y += lineHeight;

        // Other lines: normal font
        for (let i = 1; i < civilLines.length; i++) {
            doc.setFont('helvetica', 'normal');
            doc.text(civilLines[i], 20, y);
            y += lineHeight;
        }

        y += 4;

        // === Criminal Proceedings ===
        const criminalTitle = 'Criminal Proceedings:';
        const criminalText = ' Criminal Petition / Criminal Appeal / Sessions Case / Special Sessions Case / Criminal Miscellaneous Petition / Criminal Revision Appeal before the Magistrate Court, Sessions Court and High Court in its Criminal Cases, Private Complaint Report, Criminal Appeals, respectively.';

        const criminalCombined = criminalTitle + criminalText;
        const criminalLines = doc.splitTextToSize(criminalCombined, pageWidth - 40);

        // First line: separate bold and normal
        const firstCriminalLine = criminalLines[0];
        if (firstCriminalLine.startsWith(criminalTitle)) {
            const normalPart = firstCriminalLine.slice(criminalTitle.length);

            doc.setFont('helvetica', 'bold');
            doc.text(criminalTitle, 20, y);

            const boldWidth = doc.getTextWidth(criminalTitle);
            doc.setFont('helvetica', 'normal');
            doc.text(normalPart, 20 + boldWidth, y);
        } else {
            doc.setFont('helvetica', 'normal');
            doc.text(firstCriminalLine, 20, y);
        }

        y += lineHeight;

        // Other lines
        for (let i = 1; i < criminalLines.length; i++) {
            doc.setFont('helvetica', 'normal');
            doc.text(criminalLines[i], 20, y);
            y += lineHeight;
        }



        y += 6;

        // ---- DATA TABLE ----
        doc.setFontSize(12);
        const colWidth = (pageWidth - 40) / 2;
        const rowHeight = lineHeight + 1;
        const tableX = 20;

        const entries = [
            ['Reference ID', courtData.reference_id || ''],
            ['Full Name', courtData.full_name || ''],
            ["Father's Name", courtData["father's_name"] || ''],
            ['Date of Birth', courtData.date_of_birth || ''],
            ['Permanent Address', courtData.permanent_address || ''],
            ['Current Address', courtData.current_address || ''],
            ['Number of Years Search', courtData.number_of_years_search || ''],
            ['Date of Verification', courtData.date_of_verification || ''],
            ['Verification Status', courtData.verification_status || ''],

        ];
        doc.setLineWidth(0.1);
        const mymaxwidth = colWidth - 4;

        entries.forEach(([label, value]) => {
            const wrappedLabel = doc.splitTextToSize(label, mymaxwidth);
            const wrappedValue = doc.splitTextToSize(String(value), mymaxwidth);

            const linesCount = Math.max(wrappedLabel.length, wrappedValue.length);
            const dynamicRowHeight = linesCount * 7; // 7 is approx line height

            // Borders
            doc.rect(tableX, y - 6, colWidth, dynamicRowHeight);
            doc.rect(tableX + colWidth, y - 6, colWidth, dynamicRowHeight);

            // Text
            wrappedLabel.forEach((line, idx) => {
                doc.text(line, tableX + 2, y + (idx * 7));
            });

            wrappedValue.forEach((line, idx) => {
                doc.text(line, tableX + colWidth + 2, y + (idx * 7));
            });

            y += dynamicRowHeight;

            // Page break logic
            if (y > doc.internal.pageSize.getHeight() - 30) {
                doc.addPage();
                y = 20;
            }
        });
        y += 2;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('RESULT', pageWidth / 2, y, { align: 'center' });
        // ---- DISCLAIMER ----
        y += 8;

        const tableColumn = [
            "COURT/CHECK TYPE",
            "JURISDICTION",
            "LOCATION",
            "VERIFICATION RESULT"
        ];

        const courtTableData = courtData.courtTable;
        const tableRows = courtTableData.map(item => [
            item.courtCheckType,
            item.jurisdiction,
            item.location,
            item.verificationResult
        ]);
        const margin = 20; // left/right margin

        const tableWidth = pageWidth - 2 * margin;

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: y,
            styles: {
                halign: 'center',
                valign: 'middle',
                fontSize: 10,
                lineColor: [0, 0, 0], // black borders
                lineWidth: 0.1,
            },
            didDrawPage: function (data) {
                navbar(doc);
            },
            headStyles: {
                fillColor: [200, 200, 200], // white header background
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                cellPadding: 1, // smaller padding for header
            },

            bodyStyles: {
                cellPadding: { top: 1, right: 1, bottom: 1, left: 1 }, // extra left padding
                fillColor: [255, 255, 255], // white background for rows
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
            },
            alternateRowStyles: {
                fillColor: [255, 255, 255] // sets fill for all rows
            },
            columnStyles: {
                0: { halign: 'left' },   // First column left
                1: { halign: 'left' }, // Second column center (optional)
                2: { halign: 'center' }, // Third column center (optional)
                3: { halign: 'center' }  // Fourth column center
            },
            tableLineColor: [0, 0, 0],
            tableLineWidth: 0.1,
            margin: { left: margin, right: margin }, // set left/right margin
            tableWidth: tableWidth, // this is optional since margin already controls it
        });



        doc.addPage();
        navbar(doc)
        y = hrY + 5;



        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');

        doc.text('DISCLAIMER', pageWidth / 2, y, { align: 'center' });




        if (y > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            navbar(doc)
            y = hrY + 5;
        }
        else {
            y += 8;
        }

        const noteLines = [
            [
                { text: 'It has been verified that the above individual has', bold: false },
                { text: 'no case pending or disposed of', bold: true },
                { text: 'in his/her name within the jurisdiction of the court, as per available data.', bold: false },
            ],
            [
                { text: '', }
            ],
            [
                { text: `No adverse court records were found against the applicant as of ${courtData.date_of_verification}.`, bold: false },],
            [
                { text: '', }
            ],
            [
                { text: 'If certified or physical records are required, the same can be obtained through the appropriate legal process as per the relevant court or authority.', }
            ],
            [
                { text: '', }
            ],
            [
                { text: 'This report is issued based on data retrieved from', },
                { text: 'public domain sources, e-Courts portals, and/or officially permitted access.', bold: true },
            ],
            [
                { text: '', }
            ],
            [
                { text: '“Nava Nayana Legal Chambers” ', bold: true },
                { text: 'does not guarantee the completeness or finality of the information and shall not be held liable for any actions taken by third parties based on this report.', bold: false },
            ],
            [
                { text: '', }
            ],
            [
                { text: 'This document is confidential and intended solely for the authorized recipient. Any unauthorized sharing, copying, or reliance is not permitted without prior written consent.', bold: false },
            ],
        ];

        doc.setFontSize(12);
        const marginLeft = 20;
        const marginRight = 20;
        const maxWidth = pageWidth - marginLeft - marginRight;
        const wordSpacing = 1.5; // adjust as needed

        // --- 1) Measure total height ---
        let totalNoteHeight = 0;
        const tempY = y;  // Current position
        const tempLineHeight = lineHeight;
        doc.setFontSize(12);
        noteLines.forEach(lineArray => {
            if (lineArray.length === 1 && lineArray[0].text.trim() === '') {
                totalNoteHeight += tempLineHeight;
            } else {
                // Estimate line splits
                let styleMap = [];
                lineArray.forEach(part => {
                    const words = part.text.split(' ');
                    words.forEach(word => {
                        styleMap.push({ word, bold: part.bold });
                    });
                });

                let currentWidth = 0;
                let lineCount = 1;

                styleMap.forEach(item => {
                    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                    const wordWidth = doc.getTextWidth(item.word + ' ');
                    if (currentWidth + wordWidth > maxWidth) {
                        lineCount++;
                        currentWidth = wordWidth;
                    } else {
                        currentWidth += wordWidth;
                    }
                });

                totalNoteHeight += lineCount * tempLineHeight;
            }
        });

        // --- 2) Add new page if needed ---
        if (y + totalNoteHeight > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            doc.setFontSize(12);
            navbar(doc);
            y = hrY + 5;  // or whatever top Y you use
        }
        doc.setFontSize(12);
        // --- 3) Now render noteLines as usual ---
        noteLines.forEach(lineArray => {
            if (lineArray.length === 1 && lineArray[0].text.trim() === '') {
                y += lineHeight;
                return;
            }

            let styleMap = [];
            lineArray.forEach(part => {
                const words = part.text.split(' ');
                words.forEach(word => {
                    styleMap.push({ word, bold: part.bold });
                });
            });

            let lines = [];
            let currentLine = [];
            let currentWidth = 0;

            styleMap.forEach(item => {
                doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                const wordWidth = doc.getTextWidth(item.word + ' ');

                if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = [item];
                    currentWidth = wordWidth;
                } else {
                    currentLine.push(item);
                    currentWidth += wordWidth;
                }
            });
            if (currentLine.length) lines.push(currentLine);

            lines.forEach((lineWords, index) => {
                let totalWordsWidth = 0;
                lineWords.forEach(item => {
                    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                    totalWordsWidth += doc.getTextWidth(item.word + ' ');
                });

                const gaps = lineWords.length - 1;
                let extraSpace = gaps > 0 ? (maxWidth - totalWordsWidth) / gaps : 0;

                if (index === lines.length - 1) extraSpace = 0;

                let x = marginLeft;

                lineWords.forEach((item, i) => {
                    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                    doc.text(item.word, x, y);

                    let wordWidth = doc.getTextWidth(item.word + ' ');
                    x += wordWidth;

                    if (i < lineWords.length - 1) {
                        x += extraSpace;
                    }
                });

                y += lineHeight;
            });
        });


        const qrCodeBase64w = "https://webstepdev.com/screeningstarAssets/stamp.png";
        doc.addImage(qrCodeBase64w, "PNG", imgX, y, 60, 25);
        if (y > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            doc.setFontSize(12);
            navbar(doc)
            y = hrY + 5;
        }
        else {
            y += 8;
        }

        if (shouldSave) {
            doc.save('Court_Record_Report.pdf');
        } else {
            return doc;
        }
    }
    const generateCourtDOCX = async (courtData) => {
        const advocateDetails = [
               "NAVA NAYANA LEGAL CHEMBERS",
            "MANJUNATHA H S",
            "ADVOCATE, BBM, LLB",
            "ENROLL NO - KAR 4765/2023",
            "MOBILE NO: 9738812694",
            "MANJUNATH.9738812694@GMAIL.COM",
        ];

        const headerImageUrl = "https://webstepdev.com/screeningstarAssets/advocate.png";
        const stampImageUrl = "https://webstepdev.com/screeningstarAssets/stamp.png";

        const fetchImageBuffer = async url => {
            const res = await fetch(url);
            return res.arrayBuffer();
        };

        const headerImage = await fetchImageBuffer(headerImageUrl);
        const stampImage = await fetchImageBuffer(stampImageUrl);

        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
                new TableRow({
                    children: [
                        // === Logo Cell ===
                        new TableCell({
                            width: { size: 15, type: WidthType.PERCENTAGE }, // roughly ~80px on A4
                            borders: noBorders,
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.LEFT,
                                    children: [
                                        new ImageRun({
                                            data: headerImage,
                                            transformation: { width: 80, height: 80 },
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        // === Spacer Cell (~200px) ===
                        new TableCell({
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            borders: noBorders,
                            children: [new Paragraph("")],
                        }),

                        // === Vertical Line Cell ===
                        new TableCell({
                            width: { size: 1, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: {
                                    style: BorderStyle.SINGLE,
                                    size: 4,
                                    color: "000000",
                                },
                            },
                            children: [new Paragraph("")],
                        }),

                        // === Advocate Details Cell ===
                        new TableCell({
                            width: { size: 59, type: WidthType.PERCENTAGE },
                            borders: noBorders,
                            children: advocateDetails.map(line =>
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    children: [new TextRun({ text: line, size: 20 })],
                                })
                            ),
                        }),
                    ],
                }),
            ],
        });




        const tableEntries = [
            ['Reference ID', courtData.reference_id],
            ['Full Name', courtData.full_name],
            ["Father's Name", courtData["father's_name"]],
            ['Date of Birth', courtData.date_of_birth],
            ['Permanent Address', courtData.permanent_address],
            ['Current Address', courtData.current_address],
            ['Number of Years Search', courtData.number_of_years_search],
            ['Date of Verification', courtData.date_of_verification],
            ['Verification Status', courtData.verification_status],
        ];

        const doc = new Document({
            sections: [{
                children: [

                    // === HEADER TABLE ===
                    headerTable,

                    // === HR LINE ===
                    new Paragraph({
                        spacing: { before: 200, after: 200 },
                        border: {
                            bottom: {
                                style: BorderStyle.SINGLE,
                                size: 6,
                                color: "000000",
                            },
                        },
                        children: [new TextRun("")],
                    }),


                    // === TITLE ===
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "COURT RECORD REPORT", bold: true, size: 28 })],
                        spacing: { after: 300 },
                    }),

                    // === INTRO ===
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "This is with regard to the search conducted in the Police Station referred below with regard to any criminal cases filed against the person detailed below.",
                                size: 22,
                            }),
                        ],
                        spacing: { after: 300 },
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "Civil Proceedings:", bold: true, size: 22 }),
                            new TextRun({
                                text: " Original Suit / Miscellaneous Suit / Execution / Arbitration Cases before the Civil Court and High Court in its Original and Appellate Stage.",
                                size: 22,
                            }),
                        ],
                        spacing: { after: 100 },
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "Criminal Proceedings:", bold: true, size: 22 }),
                            new TextRun({
                                text: " Criminal Petition / Criminal Appeal / Sessions Case / Special Sessions Case / Criminal Miscellaneous Petition / Criminal Revision Appeal before the Magistrate Court, Sessions Court and High Court in its Criminal Cases, Private Complaint Report, Criminal Appeals, respectively.",
                                size: 22,
                            }),
                        ],
                        spacing: { after: 300 },
                    }),

                    // === PERSONAL DETAILS TABLE ===
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                        rows: tableEntries.map(([label, value]) =>
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph(label)] }),
                                    new TableCell({ children: [new Paragraph(String(value || ''))] }),
                                ],
                            })
                        ),
                    }),

                    new Paragraph({ spacing: { after: 300 }, text: "" }),

                    // === RESULT TITLE ===
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "RESULT", bold: true, size: 28 })],
                        spacing: { after: 200 },
                    }),

                    // === COURT RESULT TABLE ===
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                        rows: [
                            new TableRow({
                                children: ["COURT/CHECK TYPE", "JURISDICTION", "LOCATION", "VERIFICATION RESULT"].map(
                                    heading => new TableCell({
                                        children: [new Paragraph({ text: heading, bold: true })],
                                    })
                                ),
                            }),
                            ...(courtData.courtTable || []).map(row => new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph(row.courtCheckType || '')] }),
                                    new TableCell({ children: [new Paragraph(row.jurisdiction || '')] }),
                                    new TableCell({ children: [new Paragraph(row.location || '')] }),
                                    new TableCell({ children: [new Paragraph(row.verificationResult || '')] }),
                                ],
                            })),
                        ],
                    }),

                    new Paragraph({ spacing: { after: 300 }, text: "" }),

                    // === DISCLAIMER HEADING ===
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "DISCLAIMER", bold: true, size: 22 })],
                        spacing: { after: 200 },
                    }),

                    // === DISCLAIMER PARAGRAPHS ===
                    ...[
                        ["It has been verified that the above individual has ", "no case pending or disposed of", " in his/her name within the jurisdiction of the court, as per available data."],
                        [{ text: `No adverse court records were found against the applicant as of ${courtData.date_of_verification_at_station}.` }]
                        ["If certified or physical records are required, the same can be obtained through the appropriate legal process as per the relevant court or authority."],
                        ["This report is issued based on data retrieved from ", "public domain sources, e-Courts portals, and/or officially permitted access."],
                        ["“Nava Nayana Legal Chambers” ", "does not guarantee the completeness or finality of the information and shall not be held liable for any actions taken by third parties based on this report."],
                        ["This document is confidential and intended solely for the authorized recipient. Any unauthorized sharing, copying, or reliance is not permitted without prior written consent."]
                    ].map(parts => new Paragraph({
                        children: parts.map((part, i) =>
                            new TextRun({ text: part, bold: i === 1 })
                        ),
                        spacing: { after: 150 },
                    })),

                    // === STAMP IMAGE ===
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: stampImage,
                                transformation: { width: 100, height: 40 },
                            }),
                        ],
                        spacing: { before: 300 },
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, "Court_Record_Report.docx");
    };


    const generatePoliceDOCX = async (policeData) => {
        const advocateDetails = [
               "NAVA NAYANA LEGAL CHEMBERS",
            "MANJUNATHA H S",
            "ADVOCATE, BBM, LLB",
            "ENROLL NO - KAR 4765/2023",
            "MOBILE NO: 9738812694",
            "MANJUNATH.9738812694@GMAIL.COM",
        ];

        const headerImageUrl = "https://webstepdev.com/screeningstarAssets/advocate.png";
        const stampImageUrl = "https://webstepdev.com/screeningstarAssets/stamp.png";

        const fetchImageBuffer = async url => {
            const res = await fetch(url);
            return res.arrayBuffer();
        };

        const headerImage = await fetchImageBuffer(headerImageUrl);
        const stampImage = await fetchImageBuffer(stampImageUrl);

        // Header section: Image + vertical line + advocate info in two columns
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
                new TableRow({
                    children: [
                        // === Logo Cell ===
                        new TableCell({
                            width: { size: 15, type: WidthType.PERCENTAGE }, // roughly ~80px on A4
                            borders: noBorders,
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.LEFT,
                                    children: [
                                        new ImageRun({
                                            data: headerImage,
                                            transformation: { width: 80, height: 80 },
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        // === Spacer Cell (~200px) ===
                        new TableCell({
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            borders: noBorders,
                            children: [new Paragraph("")],
                        }),

                        // === Vertical Line Cell ===
                        new TableCell({
                            width: { size: 1, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: {
                                    style: BorderStyle.SINGLE,
                                    size: 4,
                                    color: "000000",
                                },
                            },
                            children: [new Paragraph("")],
                        }),

                        // === Advocate Details Cell ===
                        new TableCell({
                            width: { size: 59, type: WidthType.PERCENTAGE },
                            borders: noBorders,
                            children: advocateDetails.map(line =>
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    children: [new TextRun({ text: line, size: 20 })],
                                })
                            ),
                        }),
                    ],
                }),
            ],
        });

        const doc = new Document({
            sections: [{
                children: [
                    headerTable,

                    // Thin horizontal rule
                    new Paragraph({
                        spacing: { before: 200, after: 200 },
                        border: {
                            bottom: {
                                style: BorderStyle.SINGLE,
                                size: 4,
                                color: "000000",
                            },
                        },
                        children: [new TextRun("")],
                    }),

                    // Title
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "POLICE RECORD REPORT [LAW FIRM]", bold: true, size: 28 })],
                        spacing: { after: 200 },
                    }),

                    // Intro paragraph
                    new Paragraph({
                        children: [new TextRun({
                            text: "This is with regard to the search conducted in the Police Station referred below with regard to any criminal cases filed against the person detailed below.",
                            size: 22,
                        })],
                        spacing: { after: 300 },
                    }),

                    // Data table
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            ...[
                                ['Reference ID', policeData.reference_id],
                                ['Full Name', policeData.full_name],
                                ["Father's Name", policeData["father's_name"]],
                                ['Date of Birth', policeData.date_of_birth],
                                ['Address', policeData.address],
                                ['Name of the Police Station', policeData.name_of_the_police_station],
                                ['Locality / Jurisdiction', policeData["locality_/_jurisdiction"]],
                                ['Name of the Station House Officer', policeData.name_of_the_station_house_officer],
                                ['Designation of the officer / SHO', policeData["designation_of_the_officer_/_sho"]],
                                ['Phone Number of Police Station', policeData.phone_number_of_police_station],
                                ['Number of Years covered in the station', policeData.number_of_years_covered_in_the_station],
                                ['Date of Verification at Station', policeData.date_of_verification_at_station],
                                ['Verification Status from Station', policeData.verification_status_from_station],
                                ['Overall Track Records Status', policeData.overall_track_records_status],
                            ].map(([label, value]) => new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
                                    }),
                                    new TableCell({
                                        children: [new Paragraph(String(value || ''))],
                                    }),
                                ]
                            }))
                        ]
                    }),

                    // Disclaimer heading
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "DISCLAIMER", bold: true, size: 24 })],
                        spacing: { before: 300, after: 200 },
                    }),

                    // Full disclaimer body
                    new Paragraph({
                        children: [new TextRun({
                            text: "The search results are based on the available registers maintained in respect of criminal case/s and suit registers in respect of civil case/s maintained in the above-mentioned Court / Police Station having jurisdiction over the address where the candidate was said to be residing. Due care has been taken in conducting the search. The records are public records and the search has been conducted on behalf of your good self and the undersigned is not responsible for any errors, inaccuracies, omissions or deletions if any in the said court or police records. The above report is based on the verbal confirmation of the concerned authority as on the date on which it is confirmed, hence this verification is subjective. Please do contact the Local Police for Candidate Police Clearance Certificate (PCC) / Police Verification Certificate.",
                            size: 20,
                        })],
                        spacing: { after: 300 },
                    }),

                    // Notes
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Note:", bold: true, size: 20 }),
                            new TextRun({ text: " This report is provided for informational purposes only and does not constitute an official police clearance or certificate.", size: 20 }),
                        ],
                        spacing: { after: 150 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "“Nava Nayana Legal Chambers”", bold: true, size: 20 }),
                            new TextRun({ text: " does not guarantee the completeness, accuracy, or finality of the information and shall not be held liable for any decisions or actions taken by third parties based on this report.", size: 20 }),
                        ],
                        spacing: { after: 150 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "This document is confidential and intended solely for the authorized recipient. Any unauthorized use, reproduction, or dissemination is strictly prohibited without prior written consent.", size: 20 }),
                        ],
                        spacing: { after: 300 },
                    }),

                    // Stamp image
                    new Paragraph({
                        children: [
                            new ImageRun({ data: stampImage, transformation: { width: 120, height: 50 } }),
                        ],
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, "Police_Record_Report.docx");
    };


    const generatePolicePDFBlob = async (policeData) => {
        const doc = await generatePolicePDF(policeData, false);
        return doc.output('blob');
    };
    const generateCourtPDFBlob = async (courtData) => {
        const doc = await generateCourtPDF(courtData, false); // don't auto-save
        return doc.output("blob"); // return as Blob
    };


    const handleDownload = async (type) => {
        const element = formRef.current;
        if (!element) return;

        Swal.fire({
            title: 'Please wait...',
            text: 'Preparing your file...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            if (type === "pdf") {
                if (formData.selectedService === "court") {
                    await generateCourtPDF(formData.court);
                } else if (formData.selectedService === "police") {
                    await generatePolicePDF(formData.police);
                }
            }

            if (type === "png" || type === "jpg") {
                let blob;
                if (formData.selectedService === "court") {
                    blob = await generateCourtPDFBlob(formData.court);
                } else if (formData.selectedService === "police") {
                    blob = await generatePolicePDFBlob(formData.police);
                }

                const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
                const pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.entry.js');
                pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

                const loadingTask = pdfjsLib.getDocument({ data: await blob.arrayBuffer() });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);

                const viewport = page.getViewport({ scale: 2 }); // Scale for quality
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const imageDataURL = canvas.toDataURL(type === "jpg" ? "image/jpeg" : "image/png");

                const a = document.createElement("a");
                a.href = imageDataURL;
                a.download = `Court_Record_Report.${type}`;
                a.click();
            }


            if (type === "word") {
                if (formData.selectedService === "court") {
                    await generateCourtDOCX(formData.court);
                } else if (formData.selectedService === "police") {
                    await generatePoliceDOCX(formData.police); // fixed: formData.police instead of formData.court
                }
            }

            Swal.close(); // Done
        } catch (error) {
            console.error('Download failed:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong while generating the file.'
            });
        }
    };



    const Loader = () => (
        <div className="flex w-full bg-white  justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    return (
        <div className="">
            <div className="bg-white md:p-12 p-6 border border-black w-full mx-auto">
                <div className='md:flex justify-between items-center'>
                    <div className="bg-white p-8 rounded-lg border border-gray-300 shadow-md w-full max-w-5xl mx-auto">
                        <div className="p-6 max-w-5xl mx-auto">
                            <div ref={formRef} className="bg-white p-8 rounded-lg border border-gray-300 shadow-md">
                                {/* Service dropdown */}
                                <div className="mb-6">
                                    <label className="block mb-2 font-semibold text-gray-700">Select Service</label>
                                    <select
                                        value={selectedService}
                                        onChange={handleServiceChange}
                                        className="w-full border border-gray-300 rounded-md p-3 bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
                                    >
                                        <option value="">-- Select a Service --</option>
                                        <option value="police">Police Record Report [LAW FIRM]</option>
                                        <option value="court">Court Record Report</option>
                                    </select>
                                </div>

                                {/* Police Report Fields */}
                                {selectedService === "police" && (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {policeFields.map((field) => {
                                            const name = field.toLowerCase().replace(/ /g, "_");
                                            return (
                                                <div key={field} className="w-full">
                                                    <label className="block mb-1 font-medium text-gray-700">{field}</label>
                                                    <input
                                                        type="text"
                                                        name={name}
                                                        placeholder={`Enter ${field}`}
                                                        value={formData[selectedService]?.[name] || ""}
                                                        onChange={handleChange}
                                                        className="w-full rounded-md p-3 border border-gray-300 bg-[#f7f6fb] focus:border-blue-500"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}



                                {/* Court Report Fields */}
                                {selectedService === "court" && (
                                    <>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {courtFields.map((field) => {
                                                const name = field.toLowerCase().replace(/ /g, "_");
                                                return (
                                                    <div key={field} className="w-full">
                                                        <label className="block mb-1 font-medium text-gray-700">{field}</label>
                                                        <input
                                                            type="text"
                                                            name={name}
                                                            placeholder={`Enter ${field}`}
                                                            value={formData[selectedService]?.[name] || ""}
                                                            onChange={handleChange}
                                                            className="w-full rounded-md p-3 border border-gray-300 bg-[#f7f6fb] focus:border-blue-500"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Dynamic Table */}
                                        <div className="mt-8">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-700">Court Details Table</h3>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full border border-gray-300">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-4 py-2 border">COURT/CHECK TYPE</th>
                                                            <th className="px-4 py-2 border">JURISDICTION</th>
                                                            <th className="px-4 py-2 border">LOCATION</th>
                                                            <th className="px-4 py-2 border">VERIFICATION RESULT</th>
                                                            <th className="px-4 py-2 border">Action</th> {/* New column */}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(formData.court?.courtTable || []).map((row, index) => (
                                                            <tr key={index} className="bg-white">
                                                                {["courtCheckType", "jurisdiction", "location", "verificationResult"].map(
                                                                    (fieldKey) => (
                                                                        <td key={fieldKey} className="border px-2 py-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Enter"
                                                                                value={row[fieldKey]}
                                                                                onChange={(e) =>
                                                                                    handleRowChange(index, fieldKey, e.target.value)
                                                                                }
                                                                                className="w-full rounded-md p-2 border border-gray-300 bg-[#f7f6fb]"
                                                                            />
                                                                        </td>
                                                                    )
                                                                )}
                                                                <td className="border px-2 py-2 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeRow(index)}
                                                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(formData.court?.courtTable || []).length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="text-center py-4 text-gray-500">
                                                                    No rows added yet.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>

                                                </table>
                                            </div>
                                            <div className="flex justify-left gap-4">
                                                {(formData.court?.courtTable?.length || 0) < 5 && (
                                                    <button
                                                        type="button"
                                                        onClick={addRow}
                                                        className="mt-4 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                                    >
                                                        Add Row
                                                    </button>
                                                )}


                                            </div>
                                        </div>
                                    </>
                                )}

                            </div>

                            {/* Download buttons */}
                            <div className="flex flex-wrap gap-4 mt-8">
                                <button
                                    onClick={() => handleDownload("pdf")}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Download PDF
                                </button>
                                <button
                                    onClick={() => handleDownload("word")}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    Download Word
                                </button>
                                <button
                                    onClick={() => handleDownload("png")}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Download PNG
                                </button>
                                <button
                                    onClick={() => handleDownload("jpg")}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                >
                                    Download JPG
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


            </div>



        </div>

    );
};
export default InactiveClients;