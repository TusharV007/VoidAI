import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    User,
    UserCredential,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
}

// Convert Firebase User to AuthUser
export const toAuthUser = (user: User): AuthUser => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
});

// Register new user
export const registerUser = async (
    email: string,
    password: string,
    displayName?: string
): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    // Update profile with display name if provided
    if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
    }

    return userCredential;
};

// Login user
export const loginUser = async (
    email: string,
    password: string
): Promise<UserCredential> => {
    return await signInWithEmailAndPassword(auth, email, password);
};

// Logout user
export const logoutUser = async (): Promise<void> => {
    await signOut(auth);
};

// Send email verification
export const sendVerificationEmail = async (user: User): Promise<void> => {
    await sendEmailVerification(user);
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
};

// Get current user's ID token
export const getCurrentUserToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
};

// Refresh user token
export const refreshUserToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(true); // Force refresh
};

// Google Sign-In
export const signInWithGoogle = async (): Promise<UserCredential> => {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
};
