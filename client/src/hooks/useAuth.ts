// Replit Auth hook - Reference: blueprint:javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false, // Don't retry - let the session establish naturally
    staleTime: 0, // Don't use stale data - always fetch fresh after cache invalidation
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Always refetch on mount to get fresh auth state
    // Custom queryFn that returns null on 401 instead of throwing
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });

      // If 401, user is not authenticated - return null
      if (res.status === 401) {
        console.log('[useAuth] Got 401 - user not authenticated');
        return null;
      }

      // For other errors, throw
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        console.error('[useAuth] Error fetching user:', res.status, text);
        throw new Error(`${res.status}: ${text}`);
      }

      const userData = await res.json();
      console.log('[useAuth] Got user data:', userData?.email);
      return userData;
    },
  });

  console.log('[useAuth] Current state - isLoading:', isLoading, 'isAuthenticated:', !!user, 'user:', user?.email);

  return {
    user: user || undefined,
    isLoading,
    isAuthenticated: !!user,
  };
}
