import React, { createContext, useState } from "react";

export const MobileContext = createContext();

export const MobileProvider = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen((prevState) => !prevState);
  };
  return (
    <MobileContext.Provider value={{ isMenuOpen, handleMenuToggle ,setIsMenuOpen }}>
      {children}
    </MobileContext.Provider>

  );
};
