export const logout = () => {
  localStorage.removeItem('token');
};

export const redirectToGoogle = () => {
  const redirectUri = encodeURIComponent('http://localhost:5173/auth/callback');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const scope = encodeURIComponent('openid email profile');

  window.location.href =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}`;
};
