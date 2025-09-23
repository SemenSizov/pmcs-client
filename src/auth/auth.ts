import { removeAuthTokenFromApi } from "../api/api";

export const clearToken = () => {
  sessionStorage.removeItem('token');
  removeAuthTokenFromApi();
};

export const redirectToGoogle = () => {
  const redirectUri = encodeURIComponent(import.meta.env.VITE_AUTH_CALLBACK);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const scope = encodeURIComponent('openid email profile');

  window.location.href =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}`;
};
