import { UserProfile, CustomProductDatabase, CompanyProfile } from "../types";

const USER_KEY = 'inducomp_user';
const DB_KEY = 'inducomp_custom_db';
const COMPANY_KEY = 'inducomp_company';

export const customDataService = {
  // --- AUTH ---
  getUser: (): UserProfile | null => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  register: (user: UserProfile) => {
    const newUser = { ...user, isLoggedIn: true };
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  login: (username: string, password?: string): UserProfile | null => {
    // For demo, we just check existence, real app needs secure backend
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    const user = JSON.parse(stored);
    if (user.username === username) { // Simplified check
        const loggedIn = { ...user, isLoggedIn: true };
        localStorage.setItem(USER_KEY, JSON.stringify(loggedIn));
        return loggedIn;
    }
    return null;
  },

  logout: () => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
        const user = JSON.parse(stored);
        user.isLoggedIn = false;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  updateProfile: (user: UserProfile) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  // --- COMPANY ---
  getCompanyProfile: (): CompanyProfile => {
    const data = localStorage.getItem(COMPANY_KEY);
    return data ? JSON.parse(data) : { name: '', description: '', website: '', images: [] };
  },

  saveCompanyProfile: (profile: CompanyProfile) => {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(profile));
  },

  // --- DATABASE ---
  getDatabases: (): CustomProductDatabase[] => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveDatabases: (dbs: CustomProductDatabase[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(dbs));
  }
};