import React, { createContext, useState, useEffect } from "react";

export const DemoModeContext = createContext({
  isDemoMode: false,
  setIsDemoMode: () => {},
});

export const DemoModeProvider = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Load demo mode state from localStorage on init
    const saved = localStorage.getItem("isDemoMode");
    return saved === "true";
  });

  useEffect(() => {
    console.log(`[DemoModeProvider] Mounted - isDemoMode: ${isDemoMode}`);
  }, []);

  useEffect(() => {
    console.log(`[DemoModeProvider] isDemoMode changed: ${isDemoMode}`);
    localStorage.setItem("isDemoMode", isDemoMode);
  }, [isDemoMode]);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, setIsDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
};
