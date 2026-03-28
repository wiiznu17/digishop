import { createElement, useState, type ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open
      ? createElement('div', { 'data-testid': 'alert-dialog' }, children)
      : null,
  AlertDialogContent: ({ children }: { children: ReactNode }) =>
    createElement('div', null, children),
  AlertDialogHeader: ({ children }: { children: ReactNode }) =>
    createElement('div', null, children),
  AlertDialogTitle: ({ children }: { children: ReactNode }) =>
    createElement('h2', null, children),
  AlertDialogDescription: ({ children }: { children: ReactNode }) =>
    createElement('p', null, children),
  AlertDialogFooter: ({ children }: { children: ReactNode }) =>
    createElement('div', null, children),
  AlertDialogCancel: ({
    children,
    onClick
  }: {
    children: ReactNode
    onClick?: () => void
  }) => createElement('button', { type: 'button', onClick }, children),
  AlertDialogAction: ({
    children,
    onClick
  }: {
    children: ReactNode
    onClick?: () => void
  }) => createElement('button', { type: 'button', onClick }, children)
}))

vi.mock('@/components/ui/button', () => ({
  buttonVariants: () => ''
}))

vi.mock('@/utils/tailwindUtils', () => ({
  cn: (...parts: Array<string | undefined | null | false>) =>
    parts.filter(Boolean).join(' ')
}))

let ConfirmProvider: typeof import('@/providers/ConfirmProvider').ConfirmProvider
let useConfirm: typeof import('@/providers/ConfirmProvider').useConfirm

beforeAll(async () => {
  const confirmProviderModule = await import('@/providers/ConfirmProvider')
  ConfirmProvider = confirmProviderModule.ConfirmProvider
  useConfirm = confirmProviderModule.useConfirm
})

type ConfirmOptions = import('@/providers/ConfirmProvider').ConfirmOptions

function ConfirmConsumer() {
  const { confirm } = useConfirm()
  const [singleResult, setSingleResult] = useState('pending')
  const [queueResults, setQueueResults] = useState([] as string[])

  const runSingleConfirm = async (options: ConfirmOptions) => {
    const result = await confirm(options)
    setSingleResult(String(result))
  }

  const runQueuedConfirms = async () => {
    const first = confirm({
      title: 'First confirm',
      description: 'Resolve the first confirmation',
      confirmText: 'Confirm first',
      cancelText: 'Cancel first'
    }).then((result) => {
      setQueueResults((current) => [...current, `first:${result}`])
      return result
    })

    const second = confirm({
      title: 'Second confirm',
      description: 'Resolve the second confirmation',
      confirmText: 'Confirm second',
      cancelText: 'Cancel second',
      variant: 'destructive'
    }).then((result) => {
      setQueueResults((current) => [...current, `second:${result}`])
      return result
    })

    await Promise.all([first, second])
  }

  return createElement(
    'div',
    null,
    createElement(
      'button',
      {
        type: 'button',
        onClick: () =>
          runSingleConfirm({
            title: 'Delete item?',
            description: 'This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Keep',
            variant: 'destructive'
          })
      },
      'Open single confirm'
    ),
    createElement(
      'button',
      {
        type: 'button',
        onClick: runQueuedConfirms
      },
      'Open queued confirms'
    ),
    createElement('div', { 'data-testid': 'single-result' }, singleResult),
    createElement(
      'div',
      { 'data-testid': 'queue-results' },
      queueResults.join(',')
    )
  )
}

describe('ConfirmProvider', () => {
  it('resolves true when the user confirms', async () => {
    render(
      createElement(ConfirmProvider, null, createElement(ConfirmConsumer, null))
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open single confirm' }))

    expect(screen.queryByText('Delete item?')).not.toBeNull()
    expect(screen.queryByText('This action cannot be undone.')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.getByTestId('single-result').textContent).toBe('true')
    })
  })

  it('queues confirmations and resolves them in order', async () => {
    render(
      createElement(ConfirmProvider, null, createElement(ConfirmConsumer, null))
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Open queued confirms' })
    )

    expect(screen.queryByText('First confirm')).not.toBeNull()
    expect(screen.queryByText('Second confirm')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel first' }))

    await waitFor(() => {
      expect(screen.queryByText('Second confirm')).not.toBeNull()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Confirm second' }))

    await waitFor(() => {
      expect(screen.getByTestId('queue-results').textContent).toBe(
        'first:false,second:true'
      )
    })
  })
})
