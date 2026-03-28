import type { QueryClient } from '@tanstack/react-query'

export type QuerySnapshot<T> = [readonly unknown[], T | undefined]
export type QueryListSnapshot<T> = Array<QuerySnapshot<T>>

export function captureQueriesSnapshot<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
) {
  return queryClient.getQueriesData<T>({ queryKey })
}

export function restoreQueriesSnapshot<T>(
  queryClient: QueryClient,
  snapshot?: QueryListSnapshot<T>
) {
  if (!snapshot) return

  snapshot.forEach(([key, value]) => {
    queryClient.setQueryData(key, value)
  })
}

export function captureQuerySnapshot<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): QuerySnapshot<T> {
  return [queryKey, queryClient.getQueryData<T>(queryKey)]
}

export function restoreQuerySnapshot<T>(
  queryClient: QueryClient,
  snapshot?: QuerySnapshot<T>
) {
  if (!snapshot) return
  queryClient.setQueryData(snapshot[0], snapshot[1])
}

export function invalidateQueryGroups(
  queryClient: QueryClient,
  queryKeys: readonly (readonly unknown[])[]
) {
  queryKeys.forEach((queryKey) => {
    void queryClient.invalidateQueries({ queryKey })
  })
}
