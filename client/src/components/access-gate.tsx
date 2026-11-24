import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setApiToken } from '@/lib/config';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function AccessGate({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<'checking' | 'required' | 'managed' | 'token'>('checking');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let current = true;
    void apiRequest('GET', 'auth/session').then(
      () => {
        if (current) setAccess('managed');
      },
      () => {
        if (current) setAccess('required');
      }
    );
    return () => {
      current = false;
    };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setApiToken(token);
    try {
      await apiRequest('GET', 'auth/session');
      queryClient.clear();
      setToken('');
      setAccess('token');
    } catch (failure) {
      setApiToken();
      setError(failure instanceof Error ? failure.message : 'Unable to verify access');
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setApiToken();
    queryClient.clear();
    setAccess('required');
  }

  if (access === 'checking') {
    return (
      <p className="p-6" role="status">
        Checking access…
      </p>
    );
  }
  if (access === 'required') {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <form
          className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6"
          onSubmit={event => {
            void signIn(event);
          }}
        >
          <h1 className="text-xl font-semibold">Sign in to ZIP Wizard</h1>
          <label className="block space-y-2" htmlFor="api-token">
            <span>API token</span>
            <Input
              id="api-token"
              type="password"
              autoComplete="off"
              value={token}
              required
              onChange={event => {
                setToken(event.target.value);
              }}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </main>
    );
  }

  return (
    <>
      {access === 'token' && (
        <div className="flex justify-end border-b px-4 py-2">
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      )}
      {children}
    </>
  );
}
