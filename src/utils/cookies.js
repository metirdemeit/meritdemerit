// src/utils/cookies.js
export const setCookie = (name, value, days = 30) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export const getCookie = (name) => {
  const row = document.cookie
    .split("; ")
    .find(r => r.startsWith(name + "="));
  if (!row) return null;
  const rawValue = row.split("=").slice(1).join("=");
  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};
  