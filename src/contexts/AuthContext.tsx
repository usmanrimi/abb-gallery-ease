import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin_ops" | "customer" | "super_admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  roleError: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleError, setRoleError] = useState<boolean>(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role fetch with setTimeout to prevent deadlock
        if (session?.user) {
          setRoleError(false);
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setRoleError(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string, retries = 3) => {
    try {
      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching role:', error);
        // If it's a real error (not just missing profile), retry
        if (retries > 0) {
          setTimeout(() => fetchUserRole(userId, retries - 1), 1000);
        } else {
          setRoleError(true);
        }
        return;
      }

      if (data) {
        setRole(data.role as UserRole);
        setRoleError(false);
      } else {
        // No profile found - this might be the issue for new admins
        if (retries > 0) {
          setTimeout(() => fetchUserRole(userId, retries - 1), 1000);
        } else {
          setRoleError(true);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setRoleError(true);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { data, error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    setRoleError(false);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setRoleError(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, roleError, signUp, signIn, signOut, refreshRole: () => user && fetchUserRole(user.id) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
