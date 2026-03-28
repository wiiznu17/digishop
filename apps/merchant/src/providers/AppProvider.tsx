'use client'

import { PropsWithChildren, useState } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import {
  QueryClient,
  QueryClientProvider,
  isServer
} from '@tanstack/react-query'
import { store } from '@/store'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false
      },
      mutations: {
        retry: 0
      }
    }
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  }

  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

export default function AppProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(getQueryClient)

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ReduxProvider>
  )
}
