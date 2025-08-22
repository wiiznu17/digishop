import { useState, useMemo, useCallback } from "react"

interface UsePaginationProps<T> {
  data: T[]
  itemsPerPage?: number
  initialPage?: number
}

export function usePagination<T>({
  data,
  itemsPerPage: initialItemsPerPage = 20,
  initialPage = 1
}: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage))

  console.log("usePagination Debug:", {
    dataLength: data.length,
    itemsPerPage,
    currentPage,
    totalPages,
    paginatedDataLength: paginatedData.length
  })

  const goToPage = useCallback(
    (page: number) => {
      const clampedPage = Math.max(1, Math.min(page, totalPages))
      console.log("goToPage:", { page, clampedPage, totalPages })
      setCurrentPage(clampedPage)
    },
    [totalPages]
  ) // ← ขึ้นอยู่กับ totalPages

  const changeItemsPerPage = useCallback(
    (newItemsPerPage: number) => {
      console.log("changeItemsPerPage:", {
        old: itemsPerPage,
        new: newItemsPerPage,
        currentPage,
        dataLength: data.length
      })

      const currentFirstItem = (currentPage - 1) * itemsPerPage + 1
      const newPage = Math.max(1, Math.ceil(currentFirstItem / newItemsPerPage))

      setItemsPerPage(newItemsPerPage)
      setCurrentPage(newPage)
    },
    [currentPage, itemsPerPage, data.length]
  ) // ← dependencies ที่ใช้ในฟังก์ชัน

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [goToPage, currentPage])

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [goToPage, currentPage])

  const goToFirstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])

  const goToLastPage = useCallback(() => {
    goToPage(totalPages)
  }, [goToPage, totalPages])

  const resetPage = useCallback(() => {
    setCurrentPage(1)
  }, []) // ← ไม่มี dependencies

  return {
    currentPage,
    totalPages,
    paginatedData,
    totalItems: data.length,
    itemsPerPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    resetPage,
    changeItemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: Math.min(currentPage * itemsPerPage, data.length)
  }
}
