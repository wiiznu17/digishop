export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const e = err as { code?: string; name?: string }
  return (
    e?.code === "ERR_CANCELED" ||
    e?.name === "CanceledError" ||
    e?.name === "AbortError"
  )
}

export function extractErrorMessage(err: unknown): {
  title: string
  description?: string
} {
  // default
  let title = "Request failed"
  let description: string | undefined

  // axios-like
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any
  const status = anyErr?.response?.status as number | undefined
  const data = anyErr?.response?.data

  // ข้อความจาก backend ที่พบบ่อย
  const backendMsg =
    data?.message ??
    data?.error ??
    (Array.isArray(data?.errors) ? data.errors.join(", ") : undefined)

  if (backendMsg) description = String(backendMsg)

  // mapping ตามสถานะ
  switch (status) {
    case 400:
      title = "Bad request"
      break
    case 401:
      title = "Unauthorized"
      description = "Please sign in again."
      break
    case 403:
      title = "Forbidden"
      description = "You don’t have permission to do this action."
      break
    case 404:
      title = "Not found"
      break
    case 409:
      title = "Conflict"
      break
    case 422:
      title = "Validation error"
      break
    case 429:
      title = "Too many requests"
      description = "Please try again later."
      break
    case 500:
      title = "Server error"
      description = "Something went wrong on the server."
      break
    default: {
      // ถ้าไม่ใช่ axios หรือไม่มี status — ลองใช้ message ตรงๆ
      const msg = anyErr?.message ?? anyErr?.toString?.()
      if (!description && msg && typeof msg === "string") {
        description = msg
      }
    }
  }

  // กันกรณี string ว่าง
  if (description) description = String(description).trim() || undefined

  return { title, description }
}
