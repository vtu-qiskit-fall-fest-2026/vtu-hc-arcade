'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface OperatorProfile {
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  gatewayId: string;
}

const DEFAULT_PROFILE: OperatorProfile = {
  name: 'Field Operator',
  role: 'Station Operator & Agri-Tech Specialist',
  email: 'operator@qirrigate.farm',
  phone: '+91 98765 43210',
  location: 'Primary Farm Station',
  gatewayId: 'GW-AGRI-01',
};

interface ProfileContextType {
  profile: OperatorProfile;
  updateProfile: (updates: Partial<OperatorProfile>) => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OperatorProfile>(DEFAULT_PROFILE);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.full_name || user.username,
        role:
          user.role === 'SUPERADMIN'
            ? 'Station Superadmin'
            : user.role === 'FIELD_ENGINEER'
            ? 'Field Engineer / Operator'
            : user.role === 'AGRONOMIST'
            ? 'Agronomist & Solar Analyst'
            : user.role === 'FARMER'
            ? 'Farm Owner / Viewer'
            : 'Pending Assignment',
        email: user.email,
        phone: user.phone || '+91 98765 43210',
        location: user.location || 'Primary Farm Station',
        gatewayId: user.gateway_id || 'GW-AGRI-01',
      });
    } else {
      try {
        const saved = localStorage.getItem('q_irrigate_operator_profile');
        if (saved) {
          setProfile(JSON.parse(saved));
        }
      } catch {
        // fallback to default
      }
    }
  }, [user]);

  const updateProfile = (updates: Partial<OperatorProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('q_irrigate_operator_profile', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
