import React, { createContext, useContext, useState } from 'react';

// Create the context with the name 'bane'
const serviceContext = createContext();

// Provider component to wrap your app and provide the context value
export const ServiceProvider = ({ children }) => {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <serviceContext.Provider value={{ selectedService, setSelectedService }}>
      {children}
    </serviceContext.Provider>
  );
};

// Custom hook to use the Bane context
export const useService = () => useContext(serviceContext);
