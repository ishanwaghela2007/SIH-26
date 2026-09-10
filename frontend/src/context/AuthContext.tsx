import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'CUSTOMER' | 'WORKER' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  cooperativeSociety?: string;
  membershipId?: string;
  skills?: string[];
  verificationStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  balance?: number;
  welfareAccrued?: number;
  rating?: number;
}

const DEMO_USERS: Record<UserRole, UserProfile> = {
  CUSTOMER: {
    id: 'cust-101',
    name: 'Pooja Sharma',
    email: 'pooja.sharma@example.com',
    phone: '+91 98201 54321',
    role: 'CUSTOMER',
    balance: 1450,
  },
  WORKER: {
    id: 'work-202',
    name: 'Rameshwar Pawar',
    email: 'ramesh.pawar@coop.org',
    phone: '+91 94220 87654',
    role: 'WORKER',
    cooperativeSociety: 'Maharashtra Shramik Labour Cooperative Federation Ltd.',
    membershipId: 'MSLCF-2024-8842',
    skills: ['Plumbing (Master Certified)', 'Pipe Fitting', 'Solar Water Heater Care'],
    verificationStatus: 'APPROVED',
    balance: 3850,
    welfareAccrued: 620,
    rating: 4.9,
  },
  ADMIN: {
    id: 'admin-001',
    name: 'Dilip Rao (Registrar)',
    email: 'admin.registrar@sahakari.gov.in',
    phone: '+91 98110 11223',
    role: 'ADMIN',
    cooperativeSociety: 'District Labour Cooperative Union, Pune',
  },
};

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  switchRole: (newRole: UserRole) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: DEMO_USERS.CUSTOMER,
  role: 'CUSTOMER',
  switchRole: () => {},
  token: 'mock-jwt-token-sih',
  setToken: () => {},
  updateUserProfile: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [user, setUser] = useState<UserProfile>(DEMO_USERS.CUSTOMER);
  const [token, setToken] = useState<string | null>('mock-jwt-token-sih');

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setUser(DEMO_USERS[newRole]);
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        switchRole,
        token,
        setToken,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
