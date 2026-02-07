import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { AuthUser, toAuthUser } from '../../../lib/auth';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    error: null,
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(
            auth,
            (firebaseUser: User | null) => {
                try {
                    if (firebaseUser) {
                        setUser(toAuthUser(firebaseUser));
                    } else {
                        setUser(null);
                    }
                    setError(null);
                } catch (err) {
                    setError('Authentication error occurred');
                    console.error('Auth state change error:', err);
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setError('Authentication error occurred');
                console.error('Auth state observer error:', err);
                setLoading(false);
            }
        );

        // Set up token refresh interval (every 50 minutes)
        const tokenRefreshInterval = setInterval(
            async () => {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    try {
                        await currentUser.getIdToken(true); // Force refresh
                    } catch (err) {
                        console.error('Token refresh error:', err);
                    }
                }
            },
            50 * 60 * 1000
        ); // 50 minutes

        // Cleanup subscriptions
        return () => {
            unsubscribe();
            clearInterval(tokenRefreshInterval);
        };
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        error,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
