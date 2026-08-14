"use client";

import { createContext, useContext, useState } from "react";

interface NotFoundContextValue {
  isNotFound: boolean;
  setNotFound: (value: boolean) => void;
}

const NotFoundContext = createContext<NotFoundContextValue | null>(null);

export function NotFoundProvider({ children }: { children: React.ReactNode }) {
  const [isNotFound, setNotFound] = useState(false);
  return <NotFoundContext.Provider value={{ isNotFound, setNotFound }}>{children}</NotFoundContext.Provider>;
}

export function useNotFoundFlag() {
  const ctx = useContext(NotFoundContext);
  if (!ctx) throw new Error("useNotFoundFlag must be used within NotFoundProvider");
  return ctx;
}
