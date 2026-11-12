// Backend base URL. Override with VITE_API_URL (e.g. in .env.local) for local work.
const DEFAULT_API_URL = 'https://meritdemerit.onrender.com';

export const MAIN_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
export const EXAMPLE_URL = MAIN_URL;
