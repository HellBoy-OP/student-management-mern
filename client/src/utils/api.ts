import ky from "ky";

export const apiBase = import.meta.env.VITE_API_URL;

export const api = ky.create({
  prefix: apiBase,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  retry: 2,
});
