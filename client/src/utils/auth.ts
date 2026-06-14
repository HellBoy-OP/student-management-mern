import { useSyncExternalStore } from "react";

const AUTH_STORAGE_KEY = "student-management-auth-session";
const AUTH_CHANGE_EVENT = "student-management-auth-change";

type AuthSession = {
  studentId?: string;
  email?: string;
  fullName?: string;
};

const isObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null
);

export const setAuthSession = (session: AuthSession) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const getAuthSession = (): AuthSession | null => {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

  return parseAuthSession(storedSession);
};

const parseAuthSession = (storedSession: string | null): AuthSession | null => {

  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession: unknown = JSON.parse(storedSession);

    return isObject(parsedSession) ? parsedSession as AuthSession : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => getAuthSession() !== null;

const getAuthSessionSnapshot = () => localStorage.getItem(AUTH_STORAGE_KEY);

const subscribeToAuthSession = (callback: () => void) => {
  const handleAuthChange = () => {
    callback();
  };

  window.addEventListener("storage", handleAuthChange);
  window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

  return () => {
    window.removeEventListener("storage", handleAuthChange);
    window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  };
};

export const useAuthSession = () => parseAuthSession(useSyncExternalStore(
  subscribeToAuthSession,
  getAuthSessionSnapshot,
  () => null,
));
