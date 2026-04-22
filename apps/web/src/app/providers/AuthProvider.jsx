import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUserRequest, loginRequest } from "../../shared/api/auth";
import { AUTH_TOKEN_STORAGE_KEY, getStoredAuthToken, setStoredAuthToken } from "../../shared/api/client";

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  const role = user.role || user.roles?.[0] || null;
  return {
    userId: user.userId || user.id,
    email: user.email || "",
    role,
    roles: role ? [role] : user.roles || []
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      const storedToken = getStoredAuthToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUserRequest(storedToken);
        if (!isMounted) {
          return;
        }

        setToken(storedToken);
        setUser(normalizeUser(currentUser));
      } catch (_error) {
        if (!isMounted) {
          return;
        }

        setStoredAuthToken(null);
        setToken(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      authError,
      isAuthenticated: Boolean(user && token),
      async login(credentials) {
        setIsLoading(true);
        setAuthError("");

        try {
          const { token: nextToken } = await loginRequest(credentials);
          const currentUser = await getCurrentUserRequest(nextToken);
          const normalizedUser = normalizeUser(currentUser);

          setStoredAuthToken(nextToken);
          setToken(nextToken);
          setUser(normalizedUser);

          return normalizedUser;
        } catch (error) {
          setStoredAuthToken(null);
          setToken(null);
          setUser(null);
          setAuthError(error.message || "Unable to sign in");
          throw error;
        } finally {
          setIsLoading(false);
        }
      },
      logout() {
        setStoredAuthToken(null);
        setToken(null);
        setUser(null);
        setAuthError("");
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      },
      clearAuthError() {
        setAuthError("");
      }
    }),
    [authError, isLoading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
