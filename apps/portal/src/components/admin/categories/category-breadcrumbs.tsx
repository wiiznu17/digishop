'use client'

import { ChevronRight } from 'lucide-react'

type Props = {
  items: { uuid: string | null; name: string }[]
  onNavigate: (uuid: string | null) => void
}

export function CategoryBreadcrumbs({ items, onNavigate }: Props) {
  return (
    <div className="flex items-center gap-1 text-sm">
      {items.map((c, idx) => (
        <div key={c.uuid ?? 'root'} className="flex items-center">
          <button
            className="text-blue-600 hover:underline disabled:text-foreground/70"
            onClick={() => onNavigate(c.uuid)}
            disabled={idx === items.length - 1}
          >
            {c.name}
          </button>
          {idx < items.length - 1 && (
            <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  )
}
