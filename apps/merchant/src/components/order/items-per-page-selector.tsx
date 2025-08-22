import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface ItemsPerPageSelectorProps {
  value: number
  onValueChange: (value: number) => void
  options?: number[]
  className?: string
}

export function ItemsPerPageSelector({
  value,
  onValueChange,
  options = [10, 20, 50, 100],
  className = ""
}: ItemsPerPageSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        แสดง
      </span>
      <Select
        value={value.toString()}
        onValueChange={(val) => onValueChange(parseInt(val))}
      >
        <SelectTrigger className="w-[80px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        รายการ
      </span>
    </div>
  )
}
