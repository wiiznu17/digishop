export const merchantQueryKeys = {
  all: ['merchant'] as const,
  profile: () => ['merchant', 'profile'] as const,
  dashboard: () => ['merchant', 'dashboard'] as const,
  bankAccounts: () => ['merchant', 'bank-accounts'] as const
}
