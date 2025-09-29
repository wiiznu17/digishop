"use client"

import { ResponsiveContainer, AreaChart, Area } from "recharts"

export default function TinySparkline({
  data
}: {
  data: { x: string; y: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="y"
          stroke="var(--primary)"
          fill="url(#spark)"
          strokeWidth={2}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
