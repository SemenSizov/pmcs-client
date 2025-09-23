let logoutFn: (() => void) | null = null;

export const setLogout = (fn: () => void) => {
    logoutFn = fn;
};

export const triggerLogout = () => {
    if (logoutFn) {
        logoutFn();
    } else {
        console.warn('Logout function not set yet');
        // fallback: якщо ще не ініціалізовано контекст
        sessionStorage.removeItem('token');
        window.location.href = '/';
    }
};
