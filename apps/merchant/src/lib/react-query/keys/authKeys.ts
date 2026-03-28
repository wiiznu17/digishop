export const authQueryKeys = {
  all: ['auth'] as const,
  user: () => ['auth', 'user'] as const,
  storeStatus: () => ['auth', 'store-status'] as const
}
