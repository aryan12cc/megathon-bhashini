import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

interface User {
  email: string;
  fullName: string;
  id: string;
  picture?: string; // Add optional picture field
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          // First, decode to check for expiration without verifying signature
          const decoded: { exp: number } = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            throw new Error("Token expired");
          }

          // Token is not expired, fetch user details from backend
          const response = await fetch(`${API_URL}/api/users/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user');
          }

          const userData = await response.json();
          setUser(userData);
          localStorage.setItem('token', token);

        } catch (error) {
          console.error("Authentication error:", error);
          setUser(null);
          localStorage.removeItem('token');
        }
      } else {
        setUser(null);
        localStorage.removeItem('token');
      }
    };

    fetchUser();
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
