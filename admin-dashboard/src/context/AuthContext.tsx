import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    user: any;
    token: string | null;
    login: (token: string, userData: any) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(() => {
        const storedUser = localStorage.getItem('user');
        try {
            return storedUser && storedUser !== 'undefined' && storedUser !== 'null'
                ? JSON.parse(storedUser)
                : null;
        } catch (e) {
            console.error('Failed to parse user from local storage', e);
            return null;
        }
    });

    const [token, setToken] = useState<string | null>(() => {
        const storedToken = localStorage.getItem('token');
        return storedToken && storedToken !== 'undefined' && storedToken !== 'null' ? storedToken : null;
    });

    const [loading] = useState(false); // No need for effect if lazy loading


    const login = (newToken: string, userData: any) => {
        console.log('AuthContext: Login called', userData);
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        // api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // delete api.defaults.headers.common['Authorization'];
    };

    // Consistency check: if we have a token but no user, something is wrong (or vice versa, though less critical)
    useEffect(() => {
        if (token && !user) {
            console.warn('AuthContext: Token exists but no User data. Forcing logout.');
            logout();
        }
    }, [token, user]);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token && !!user, // Strict check
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
