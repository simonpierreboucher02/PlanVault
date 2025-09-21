import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  encryptionKey: string;
}

interface AuthResponse {
  user: User;
  sessionToken: string;
}

export function useAuth() {
  const [sessionToken, setSessionToken] = useState<string | null>(
    localStorage.getItem('sessionToken')
  );

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    enabled: !!sessionToken,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/auth/login', credentials);
      return await res.json() as AuthResponse;
    },
    onSuccess: (data) => {
      setSessionToken(data.sessionToken);
      localStorage.setItem('sessionToken', data.sessionToken);
      queryClient.setQueryData(['/api/auth/me'], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; recoveryKey: string }) => {
      const res = await apiRequest('POST', '/api/auth/register', data);
      return await res.json() as AuthResponse;
    },
    onSuccess: (data) => {
      setSessionToken(data.sessionToken);
      localStorage.setItem('sessionToken', data.sessionToken);
      queryClient.setQueryData(['/api/auth/me'], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (sessionToken) {
        await apiRequest('POST', '/api/auth/logout');
      }
    },
    onSuccess: () => {
      setSessionToken(null);
      localStorage.removeItem('sessionToken');
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
    },
  });

  const generateRecoveryKeyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/generate-recovery-key');
      return await res.json() as { recoveryKey: string };
    },
  });

  // Set up authorization header
  useEffect(() => {
    if (sessionToken) {
      queryClient.setDefaultOptions({
        queries: {
          ...queryClient.getDefaultOptions().queries,
          queryFn: async ({ queryKey }) => {
            let url = '';
            if (queryKey.length > 1 && typeof queryKey[1] === 'object') {
              // Handle object parameters by building URL with query params
              const baseUrl = queryKey[0] as string;
              const params = new URLSearchParams(queryKey[1] as Record<string, string>);
              url = `${baseUrl}?${params.toString()}`;
            } else {
              // Handle string array keys
              url = queryKey.join('/') as string;
            }
            
            const res = await fetch(url, {
              credentials: 'include',
              headers: {
                'Authorization': `Bearer ${sessionToken}`,
              },
            });

            if (res.status === 401) {
              setSessionToken(null);
              localStorage.removeItem('sessionToken');
              throw new Error('Unauthorized');
            }

            if (!res.ok) {
              const text = (await res.text()) || res.statusText;
              throw new Error(`${res.status}: ${text}`);
            }

            return await res.json();
          },
        },
      });
    }
  }, [sessionToken]);

  return {
    user,
    isLoading: isLoading && !!sessionToken,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    generateRecoveryKey: generateRecoveryKeyMutation.mutate,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
    recoveryKey: generateRecoveryKeyMutation.data?.recoveryKey,
    isGeneratingKey: generateRecoveryKeyMutation.isPending,
  };
}
