const DEFAULT_BACKEND_URL = "http://localhost:5000";

export const getBackendUrl = (env = import.meta.env) => {
  const url = env.VITE_BACKEND_URL?.trim();
  return url || DEFAULT_BACKEND_URL;
};
