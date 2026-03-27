'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TinySparkline from './TinySparkline'
import useAnimatedNumber from './useAnimatedNumber'

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>

export default function MetricCount({
  title,
  value,
  icon: Icon,
  hint,
  series
}: {
  title: string
  value: number
  icon: IconType
  hint?: string
  series: { x: string; y: number }[]
}) {
  const anim = useAnimatedNumber(value)
  return (
    <motion.div layout>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{anim.toLocaleString()}</div>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          <div className="mt-3 -mb-2">
            <TinySparkline data={series} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
