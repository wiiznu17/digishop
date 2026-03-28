'use client'

import {
  createElement,
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'
import type { ButtonProps } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { cn } from '@/utils/tailwindUtils'

type ConfirmVariant = Extract<ButtonProps['variant'], 'default' | 'destructive'>

export type ConfirmOptions = {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

type ConfirmRequest = ConfirmOptions & {
  id: number
  resolve: (value: boolean) => void
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined)

export function ConfirmProvider({ children }: PropsWithChildren) {
  const [queue, setQueue] = useState<ConfirmRequest[]>([])

  const activeRequest = queue[0] ?? null

  const settleRequest = useCallback((value: boolean) => {
    setQueue((current) => {
      const [request, ...rest] = current
      request?.resolve(value)
      return rest
    })
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setQueue((current) => [
        ...current,
        {
          id: Date.now() + current.length,
          title: options.title,
          description: options.description,
          confirmText: options.confirmText ?? 'Confirm',
          cancelText: options.cancelText ?? 'Cancel',
          variant: options.variant ?? 'default',
          resolve
        }
      ])
    })
  }, [])

  const value = useMemo<ConfirmContextValue>(
    () => ({
      confirm
    }),
    [confirm]
  )

  return createElement(
    ConfirmContext.Provider,
    { value },
    children,
    createElement(
      AlertDialog,
      {
        open: Boolean(activeRequest),
        onOpenChange: (open: boolean) => {
          if (!open && activeRequest) {
            settleRequest(false)
          }
        }
      },
      createElement(
        AlertDialogContent,
        null,
        createElement(
          AlertDialogHeader,
          null,
          createElement(AlertDialogTitle, null, activeRequest?.title),
          activeRequest?.description
            ? createElement(
                AlertDialogDescription,
                null,
                activeRequest.description
              )
            : null
        ),
        createElement(
          AlertDialogFooter,
          null,
          createElement(
            AlertDialogCancel,
            {
              onClick: () => settleRequest(false)
            },
            activeRequest?.cancelText ?? 'Cancel'
          ),
          createElement(
            AlertDialogAction,
            {
              className: cn(
                buttonVariants({
                  variant: activeRequest?.variant ?? 'default'
                })
              ),
              onClick: () => settleRequest(true)
            },
            activeRequest?.confirmText ?? 'Confirm'
          )
        )
      )
    )
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)

  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }

  return context
}
