// File: CustomMultiSelect.jsx
import React, { useState, useEffect, useRef } from "react";

const CustomMultiSelect = ({ options, value = [], onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState(value);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleOptionClick = (option) => {
        let updated;
        if (selectedValues.some(item => item.value === option.value)) {
            updated = selectedValues.filter(item => item.value !== option.value);
        } else {
            updated = [...selectedValues.filter(item => item.value !== "select_all"), option];
        }
        setSelectedValues(updated);
        onChange(updated);
    };

    const handleSelectAll = () => {
        const selectAllOption = { label: "select_all", value: "select_all" };
    
        if (options.length === 0) {
            setSelectedValues([selectAllOption]);
            onChange([selectAllOption]);
            console.log("No options available, but select_all sent");
        } else if (selectedValues.length === options.length) {
            setSelectedValues([]);
            onChange([]);
            console.log("All services deselected");
        } else {
            const allSelected = [...options, selectAllOption];
            setSelectedValues(allSelected);
            onChange(allSelected);
            console.log("All services are selected");
        }
    };
    

    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setSelectedValues(value);
    }, [value]);
    console.log('sssssselectedValues', selectedValues)
    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div
                className="border p-2.5 rounded-md bg-white cursor-pointer text-left"
                onClick={toggleDropdown}
            >
                {selectedValues.some(item => item.value === "select_all") ? (
                    <span>All services are selected</span>
                ) : selectedValues.length > 0 ? (
                    selectedValues
                        .map((item) => item.label)
                        .join(", ")
                ) : (
                    <span className="text-gray-400">{placeholder}</span>
                )}
            </div>


            {isOpen && (
                <div className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded-md shadow-md text-left">
                    <div
                        onClick={handleSelectAll}
                        className={`p-2 hover:bg-gray-200 bg-gray-100 cursor-pointer font-medium ${selectedValues.length === options.length ? "bg-blue-100" : ""
                            }`}
                    >
                        <input
                            type="checkbox"
                            readOnly
                            className="mr-2 "
                        />
                        Select All Services 
                    </div>
                    <hr />
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleOptionClick(option)}
                            className={`p-2 hover:bg-gray-100 cursor-pointer ${selectedValues.some(item => item.value === option.value)
                                    ? "bg-blue-100"
                                    : ""
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedValues.some(item => item.value === option.value)}
                                readOnly
                                className="mr-2"
                            />
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomMultiSelect;
