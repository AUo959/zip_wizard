import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AccessGate } from '@/components/access-gate';
import { getApiHeaders, setApiToken } from '@/lib/config';
import { apiRequest } from '@/lib/queryClient';

afterEach(() => {
  setApiToken();
  vi.restoreAllMocks();
});

it('uses a runtime token for API requests and clears it on sign out', async () => {
  const request = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json({ data: { id: 'operator' } }))
    .mockResolvedValueOnce(Response.json({ success: true }));
  render(
    <AccessGate>
      <p>Archive workspace</p>
    </AccessGate>
  );
  expect(screen.queryByText('Archive workspace')).not.toBeInTheDocument();

  const input = await screen.findByLabelText('API token');
  fireEvent.change(input, { target: { value: 'fixture-browser-token' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('Archive workspace')).toBeInTheDocument();
  expect(request).toHaveBeenNthCalledWith(
    2,
    '/api/v1/auth/session',
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer fixture-browser-token' }),
    })
  );

  await apiRequest('POST', 'archives', new FormData());
  expect(request).toHaveBeenNthCalledWith(
    3,
    '/api/v1/archives',
    expect.objectContaining({
      headers: { Authorization: 'Bearer fixture-browser-token' },
    })
  );

  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(screen.queryByText('Archive workspace')).not.toBeInTheDocument();
  expect(getApiHeaders()).not.toHaveProperty('Authorization');
});

it('opens the workspace when the deployment provides an authenticated session', async () => {
  const request = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(Response.json({ data: { id: 'gateway-user' } }));
  render(
    <AccessGate>
      <p>Archive workspace</p>
    </AccessGate>
  );
  expect(await screen.findByText('Archive workspace')).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith(
    '/api/v1/auth/session',
    expect.objectContaining({
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    })
  );
});
