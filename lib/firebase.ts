import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signOut as firebaseSignOut,
  User,
  UserCredential
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration - Using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo_api_key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abc123def456ghi789",
  measurementId: "G-YM0SEY3D4J"
};

// Initialize Firebase with error handling for localhost
let app: any;
let auth: any;
let analytics: any;
let googleProvider: any;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  analytics = getAnalytics(app);
  googleProvider = new GoogleAuthProvider();
  
  // Configure Google Provider
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.warn('Firebase initialization failed, using fallback mode:', error);
  // Create fallback auth object for localhost development
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      // Immediately call callback with null user for localhost
      callback(null);
      return () => {}; // Return unsubscribe function
    }
  };
}

// Smart password validation
export const validatePassword = (password: string): { isValid: boolean; strength: string; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  else feedback.push("Password should be at least 8 characters long");

  // Uppercase check
  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Add uppercase letters for better security");

  // Lowercase check
  if (/[a-z]/.test(password)) score++;
  else feedback.push("Include lowercase letters");

  // Numbers check
  if (/\d/.test(password)) score++;
  else feedback.push("Add numbers to make it stronger");

  // Special characters check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push("Special characters make passwords unbreakable");

  // Common patterns check
  const commonPatterns = [/password/i, /123456/, /qwerty/i, /admin/i];
  if (commonPatterns.some(pattern => pattern.test(password))) {
    score -= 2;
    feedback.push("Really? That's like using 'password123'! Be more creative!");
  }

  // Funny feedback based on score
  let strength = "Weak";
  if (score >= 4) strength = "Strong";
  else if (score >= 2) strength = "Medium";

  if (score === 5) {
    feedback.push("Now that's a password that would make a hacker cry!");
  } else if (score === 0) {
    feedback.push("My grandma could guess this password! Try harder!");
  }

  return {
    isValid: score >= 2,
    strength,
    feedback
  };
};

// Smart email validation
export const validateEmail = (email: string): { isValid: boolean; feedback: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { 
      isValid: false, 
      feedback: "That's not an email! Are you trying to invent a new format?" 
    };
  }

  // Check for common typos
  const commonTypos: { [key: string]: string } = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com'
  };

  const domain = email.split('@')[1];
  if (commonTypos[domain]) {
    return { 
      isValid: false, 
      feedback: `Did you mean ${email.replace(domain, commonTypos[domain])}? 🤔` 
    };
  }

  return { isValid: true, feedback: "Perfect email address!" };
};

// Check if email already exists
export const checkEmailExists = async (email: string): Promise<{
  exists: boolean;
  providers: string[];
  feedback: string;
}> => { 
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return {
      exists: methods.length > 0,
      providers: methods,
      feedback: methods.length > 0 
        ? "This email is already registered! Smart move checking first! 🎯"
        : "Fresh email! Ready to create something new! ✨"
    };
  } catch (error) {
    return {
      exists: false,
      providers: [],
      feedback: "Couldn't check email, but let's proceed anyway! 🚀"
    };
  }
};

// Authentication functions
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    if (!googleProvider) {
      throw new Error("Firebase not initialized - running in localhost mode");
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Google sign-in was cancelled. Did you change your mind? 🤔");
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error("Popup was blocked! Please allow popups for this site. 🚫");
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error("This domain isn't authorized! Add it to Firebase console. 🔧");
    }
    throw new Error("Google sign-in failed. Try again! 🔄");
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    if (!auth) {
      throw new Error("Firebase not initialized - running in localhost mode");
    }
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error("No user found with this email. Did you mean to sign up? 🤔");
    } else if (error.code === 'auth/wrong-password') {
      throw new Error("Wrong password! Are you trying to guess? 🕵️‍♂️");
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error("Too many attempts! Take a break, hacker! ☕");
    }
    throw new Error("Login failed. Try again! 🔄");
  }
};

export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    if (!auth) {
      throw new Error("Firebase not initialized - running in localhost mode");
    }
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("Email already exists! Smart move checking first! 🎯");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Password too weak! Even my grandma could crack this! 👵");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Invalid email format! Are you inventing a new internet? 🌐");
    }
    throw new Error("Sign up failed. Try again! 🔄");
  }
};

export const signOut = async (): Promise<void> => {
  try {
    if (auth && firebaseSignOut) {
      await firebaseSignOut(auth);
    }
  } catch (error) {
    throw new Error("Sign out failed. But you're free in spirit! 🕊️");
  }
};

export const getCurrentUser = (): User | null => {
  return auth?.currentUser || null;
};

export { auth, analytics };
