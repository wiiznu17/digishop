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
})
