import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkRole = useCallback(async (current: Session | null) => {
    if (!current) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", current.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(Boolean(data));
    setChecking(false);
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setChecking(true);
      setTimeout(() => void checkRole(next), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void checkRole(data.session);
    });
    return () => listener.subscription.unsubscribe();
  }, [checkRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return Boolean(data.session);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }, []);

  return { session, isAdmin, checking, signIn, signUp, signOut };
}
