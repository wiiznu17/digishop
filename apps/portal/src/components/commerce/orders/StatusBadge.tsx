'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { AdminOrderStatus } from '@/types/commerce/orders'
import { useOrderStatus } from '@/hooks/useOrderStatus'

export const StatusBadge = React.memo(function StatusBadge({
  status
}: {
  status: AdminOrderStatus
}) {
  const { getStatusBadgeColor, getStatusTextForReal } = useOrderStatus()

  const colorCls = getStatusBadgeColor(status)
  const label = getStatusTextForReal(status) ?? status

  return (
    <span className="flex justify-center">
      <Badge
        variant="outline"
        className={`border font-medium ${colorCls}`}
        title={status}
      >
        {label}
      </Badge>
    </span>
  )
})
