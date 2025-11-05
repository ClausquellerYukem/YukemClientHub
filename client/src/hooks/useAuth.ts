// Replit Auth hook - Reference: blueprint:javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: 2, // Retry up to 2 times to handle session establishment delays
    retryDelay: 200, // Wait 200ms between retries
    staleTime: 1 * 60 * 1000, // Cache for 1 minute to prevent excessive refetches
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    // Custom queryFn that returns null on 401 instead of throwing
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });

      // If 401, user is not authenticated - return null
      if (res.status === 401) {
        return null;
      }

      // For other errors, throw
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return await res.json();
    },
  });

  return {
    user: user || undefined,
    isLoading,
    isAuthenticated: !!user,
  };
}
