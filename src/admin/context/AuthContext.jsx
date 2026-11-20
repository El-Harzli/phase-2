import { createContext, useContext, useEffect, useState } from "react";
import { getSession, onAuthChange, signInWithPassword, signOut } from "@/admin/api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const { data, error } = await getSession();
        if (!active) return;
        if (error) {
          console.error("[auth] getSession failed:", error);
          return;
        }
        setSession(data.session);
      } catch (error) {
        if (!active) return;
        console.error("[auth] getSession threw:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadSession();

    const { data: authListener } = onAuthChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function login(email, password) {
    try {
      const { error } = await signInWithPassword(email, password);
      if (error) return { success: false, message: error.message };
      return { success: true };
    } catch (error) {
      console.error("[auth] signIn threw:", error);
      return {
        success: false,
        message: "Could not reach the server. Check your connection and try again.",
      };
    }
  }

  async function logout() {
    const failure = {
      success: false,
      message: "Could not reach the server to finish signing out. If you're still logged in, try again.",
    };
    try {
      const { error } = await signOut();
      if (error) {
        console.error("[auth] signOut failed:", error);
        return failure;
      }
      return { success: true };
    } catch (error) {
      console.error("[auth] signOut threw:", error);
      return failure;
    }
  }

  const value = {
    isAuthenticated: Boolean(session),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
