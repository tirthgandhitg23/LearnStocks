
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Handle access_token in URL (for email confirmations)
    const handleEmailConfirmation = async () => {
      const url = window.location.href;
      if (url.includes('#access_token=')) {
        try {
          // Extract the hash portion and convert it to a search string format
          const hash = url.split('#')[1];
          const searchParams = new URLSearchParams(hash);
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          const type = searchParams.get('type');
          
          console.log("Found access token in URL, type:", type);
          
          if (accessToken) {
            // Set the session directly with the tokens from the URL
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (type === 'recovery') {
              navigate('/reset-password');
              toast.success("Please set a new password");
            } else {
              navigate('/home');
              toast.success("Email confirmed successfully!");
            }
          }
        } catch (error) {
          console.error("Error handling email confirmation:", error);
          toast.error("There was an error confirming your email. Please try again.");
        }
      }
    };

    handleEmailConfirmation();

    // Set up auth state listener first (avoiding deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth event:", event);
        
        // Synchronous state updates
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        
        // Use setTimeout to avoid potential deadlocks with Supabase auth
        if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(async () => {
            try {
              await supabase
                .from('profiles')
                .update({ last_login_date: new Date().toISOString() })
                .eq('id', newSession.user.id);
            } catch (error) {
              console.error("Error updating last login date:", error);
            }
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to log out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
