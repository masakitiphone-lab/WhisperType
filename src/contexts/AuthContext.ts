import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  credits: number;
  dailyCredits: number;
  availableCredits: number | null;
  role: string;
  plan: "free" | "plus";
};

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  hasAccessToken: boolean;
  authFlowStatus: string | null;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccountData: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);


