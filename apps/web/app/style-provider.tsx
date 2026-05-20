"use client";

// 👇 1. Import startTransition from React
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  startTransition,
} from "react";

type StyleContextType = {
  style: string;
  setStyle: (style: string) => void;
};

const StyleContext = createContext<StyleContextType>({
  style: "corporate",
  setStyle: () => {},
});

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyle] = useState("corporate");

  useEffect(() => {
    const savedStyle = localStorage.getItem("kanban-ui-style") || "corporate";

    // We always update the DOM immediately so the CSS changes instantly
    document.documentElement.setAttribute("data-style", savedStyle);

    if (savedStyle !== "corporate") {
      // 👇 2. THE FIX: Tell React this is a low-priority background update
      startTransition(() => {
        setStyle(savedStyle);
      });
    }
  }, []);

  const handleSetStyle = (newStyle: string) => {
    setStyle(newStyle);
    localStorage.setItem("kanban-ui-style", newStyle);
    document.documentElement.setAttribute("data-style", newStyle);
  };

  return (
    <StyleContext.Provider value={{ style, setStyle: handleSetStyle }}>
      {children}
    </StyleContext.Provider>
  );
}

export const useStyle = () => useContext(StyleContext);
