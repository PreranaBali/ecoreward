import React,{ createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../context/firebase"; // <-- Update this path to where you initialized Firebase

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener automatically fires when the user logs in or logs out
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {/* Wait for Firebase to check auth state before rendering children */}
      {!loading && children}
    </AuthContext.Provider>
  );
};