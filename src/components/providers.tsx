"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { onAuthStateChanged, type User } from "firebase/auth";
import { browserAuth, firebaseConfigured } from "@/lib/firebase/client";
import { LiquidGlassRenderer } from "@/components/liquid-glass/renderer";
const AuthContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});
export const useAuth = () => useContext(AuthContext);
export function Providers({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ user: User | null; loading: boolean }>({
    user: null,
    loading: firebaseConfigured,
  });
  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(browserAuth(), (user) =>
      setState({ user, loading: false }),
    );
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthContext.Provider value={state}>
        <LiquidGlassRenderer>{children}</LiquidGlassRenderer>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
