import { createElement, PropsWithChildren } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { authQueryKeys } from '@/hooks/queries/useAuthQueries'
import type { StoreStatus, UserAuth } from '@/types/props/userProp'
import {
  fetchStoreStatus,
  fetchUser,
  loginUser,
  logoutUser
} from '@/utils/requestUtils/requestAuthUtils'

const navigationMocks = vi.hoisted(() => ({
  pathname: '/login',
  replace: vi.fn()
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => ({
    replace: navigationMocks.replace
  })
}))

vi.mock('@/utils/requestUtils/requestAuthUtils', () => ({
  fetchUser: vi.fn(),
  fetchStoreStatus: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn()
}))

function createUser(role: UserAuth['role'] = 'MERCHANT'): UserAuth {
  return {
    id: 1,
    email: 'merchant@example.com',
    role
  }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AuthProvider, null, children)
    )
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('AuthProvider', () => {
  beforeEach(() => {
    navigationMocks.pathname = '/login'
    navigationMocks.replace.mockReset()
    vi.mocked(fetchUser).mockResolvedValue(null)
    vi.mocked(fetchStoreStatus).mockResolvedValue(null)
    vi.mocked(loginUser).mockResolvedValue(null)
    vi.mocked(logoutUser).mockResolvedValue(undefined)
  })

  it('populates cache on merchant login and refreshes store status', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    const wrapper = createWrapper(queryClient)

    vi.mocked(loginUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('PENDING' as StoreStatus)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      expect(await result.current.login('merchant@example.com', 'secret')).toBe(
        true
      )
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(authQueryKeys.user())).toEqual(
        createUser()
      )
      expect(queryClient.getQueryData(authQueryKeys.storeStatus())).toBe(
        'PENDING'
      )
    })
  })

  it('clears auth caches and redirects to login on logout', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    queryClient.setQueryData(authQueryKeys.user(), createUser())
    queryClient.setQueryData(
      authQueryKeys.storeStatus(),
      'APPROVED' as StoreStatus
    )

    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('APPROVED' as StoreStatus)

    const wrapper = createWrapper(queryClient)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(queryClient.getQueryData(authQueryKeys.user())).toBeNull()
    expect(queryClient.getQueryData(authQueryKeys.storeStatus())).toBeNull()
    expect(navigationMocks.replace).toHaveBeenCalledWith('/login')
  })

  it('redirects pending merchants from non-auth pages to store status', async () => {
    navigationMocks.pathname = '/orders'
    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('PENDING' as StoreStatus)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith(
        '/store-status?status=PENDING'
      )
    })
  })

  it('allows approved merchants to stay on non-auth pages without redirect', async () => {
    navigationMocks.pathname = '/orders'
    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('APPROVED' as StoreStatus)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })

  it('redirects customers from merchant private profile routes to register', async () => {
    navigationMocks.pathname = '/profile'
    vi.mocked(fetchUser).mockResolvedValue(createUser('CUSTOMER'))

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith('/register')
    })
  })

  it('redirects customers from merchant balance routes to register', async () => {
    navigationMocks.pathname = '/balance'
    vi.mocked(fetchUser).mockResolvedValue(createUser('CUSTOMER'))

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith('/register')
    })
  })

  it('redirects customers from store-status back to register', async () => {
    navigationMocks.pathname = '/store-status?status=PENDING'
    vi.mocked(fetchUser).mockResolvedValue(createUser('CUSTOMER'))

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith('/register')
    })
  })

  it('allows approved merchants to stay on analytics pages', async () => {
    navigationMocks.pathname = '/analytics'
    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('APPROVED' as StoreStatus)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })

  it('allows approved merchants to stay on settings pages', async () => {
    navigationMocks.pathname = '/settings'
    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('APPROVED' as StoreStatus)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })

  it('redirects pending merchants from dashboard entry points to store status', async () => {
    navigationMocks.pathname = '/'
    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('PENDING' as StoreStatus)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith(
        '/store-status?status=PENDING'
      )
    })
  })

  it('allows approved merchants to stay on nested analytics routes with query strings', async () => {
    navigationMocks.pathname = '/analytics/revenue?range=30d&channel=all'
    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('APPROVED' as StoreStatus)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })

  it('allows approved merchants to stay on nested settings routes with query strings', async () => {
    navigationMocks.pathname = '/settings/preferences?tab=notifications'
    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('APPROVED' as StoreStatus)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })

  it('redirects pending merchants from nested analytics routes to store status', async () => {
    navigationMocks.pathname = '/analytics/revenue?range=7d'
    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('PENDING' as StoreStatus)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith(
        '/store-status?status=PENDING'
      )
    })
  })

  it('waits for store-status query refresh before redirecting pending merchants from nested analytics routes', async () => {
    navigationMocks.pathname = '/analytics/revenue?range=7d'
    const pendingStatus = deferred<StoreStatus | null>()
    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockReturnValue(pendingStatus.promise)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(navigationMocks.replace).not.toHaveBeenCalled()

    await act(async () => {
      pendingStatus.resolve('PENDING')
      await pendingStatus.promise
    })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith(
        '/store-status?status=PENDING'
      )
    })
  })

  it('redirects pending merchants from nested settings routes to store status', async () => {
    navigationMocks.pathname = '/settings/profile?tab=security'
    vi.mocked(fetchUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockResolvedValue('PENDING' as StoreStatus)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith(
        '/store-status?status=PENDING'
      )
    })
  })

  it('redirects customers from nested analytics routes with query strings to register', async () => {
    navigationMocks.pathname = '/analytics/revenue?range=90d'
    vi.mocked(fetchUser).mockResolvedValue(createUser('CUSTOMER'))

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith('/register')
    })
  })

  it('redirects customers from nested settings routes with query strings to register', async () => {
    navigationMocks.pathname = '/settings/preferences?tab=billing'
    vi.mocked(fetchUser).mockResolvedValue(createUser('CUSTOMER'))

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    const wrapper = createWrapper(queryClient)

    renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith('/register')
    })
  })

  it('keeps auth caches cleared when logout wins a race against a pending post-login store-status refresh', async () => {
    navigationMocks.pathname = '/login'
    const pendingStatus = deferred<StoreStatus | null>()
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    vi.mocked(loginUser).mockResolvedValue(createUser())
    vi.mocked(fetchStoreStatus).mockReturnValue(pendingStatus.promise)

    const wrapper = createWrapper(queryClient)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      expect(await result.current.login('merchant@example.com', 'secret')).toBe(
        true
      )
    })

    await waitFor(() => {
      expect(fetchStoreStatus).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(queryClient.getQueryData(authQueryKeys.user())).toBeNull()
    expect(queryClient.getQueryData(authQueryKeys.storeStatus())).toBeNull()

    await act(async () => {
      pendingStatus.resolve('APPROVED')
      await pendingStatus.promise
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(authQueryKeys.user())).toBeNull()
      expect(queryClient.getQueryData(authQueryKeys.storeStatus())).toBeNull()
    })
    expect(navigationMocks.replace).toHaveBeenCalledWith('/login')
  })
})
