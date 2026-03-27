'use client'

import React from 'react'

export type TimelineItem = {
  id: string | number
  title: React.ReactNode
  time?: React.ReactNode
  description?: React.ReactNode
  reason?: React.ReactNode
  footer?: React.ReactNode
}

export function VerticalTimeline({
  items,
  emptyText = 'No events',
  className = ''
}: {
  items: TimelineItem[]
  emptyText?: string
  className?: string
}) {
  if (!items || items.length === 0) {
    return <div className="text-sm text-muted-foreground">{emptyText}</div>
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {items.map((it, idx) => (
        <div key={it.id} className="grid grid-cols-[20px_1fr] gap-3">
          {/* dot + line column */}
          <div className="relative">
            <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
            {idx < items.length - 1 && (
              <div className="absolute left-[5px] top-4 bottom-[-10px] w-px bg-muted" />
            )}
          </div>

          {/* content column */}
          <div className="pb-3">
            <div className="text-sm">
              <span className="font-medium">{it.title}</span>
              {it.time && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {it.time}
                </span>
              )}
            </div>
            {it.description && (
              <div className="text-xs text-muted-foreground">
                {it.description}
              </div>
            )}
            {it.reason && (
              <div className="text-xs text-muted-foreground">{it.reason}</div>
            )}
            {it.footer && (
              <div className="text-[11px] text-muted-foreground/80">
                {it.footer}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
