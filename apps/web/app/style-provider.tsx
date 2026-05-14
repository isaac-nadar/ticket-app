"use client";

import { createContext, useContext, useEffect, useState } from "react";

type StyleType = "corporate" | "retro";

const StyleContext = createContext<{
  uiStyle: StyleType;
  setUiStyle: (style: StyleType) => void;
}>({ uiStyle: "corporate", setUiStyle: () => {} });

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const [uiStyle, setUiStyle] = useState<StyleType>("corporate");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Load saved style from local storage
    const saved = localStorage.getItem("ui-style") as StyleType;
    if (saved) {
      setUiStyle(saved);
      document.documentElement.setAttribute("data-style", saved);
    } else {
      document.documentElement.setAttribute("data-style", "corporate");
    }
  }, []);

  const handleSetStyle = (newStyle: StyleType) => {
    setUiStyle(newStyle);
    localStorage.setItem("ui-style", newStyle);
    document.documentElement.setAttribute("data-style", newStyle);
  };

  // Prevent hydration mismatch
  if (!mounted) return <>{children}</>;

  return (
    <StyleContext.Provider value={{ uiStyle, setUiStyle: handleSetStyle }}>
      {children}
    </StyleContext.Provider>
  );
}

export const useUiStyle = () => useContext(StyleContext);
