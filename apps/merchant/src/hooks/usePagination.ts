import { useState, useMemo } from "react"

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

  const goToPage = (page: number) => {
    const clampedPage = Math.max(1, Math.min(page, totalPages))
    console.log("goToPage:", { page, clampedPage, totalPages })
    setCurrentPage(clampedPage)
  }

  const changeItemsPerPage = (newItemsPerPage: number) => {
    console.log("changeItemsPerPage:", {
      old: itemsPerPage,
      new: newItemsPerPage,
      currentPage,
      dataLength: data.length
    })

    // คำนวณรายการแรกของหน้าปัจจุบัน
    const currentFirstItem = (currentPage - 1) * itemsPerPage + 1

    // คำนวณหน้าใหม่ที่ควรไปอยู่
    const newPage = Math.max(1, Math.ceil(currentFirstItem / newItemsPerPage))

    setItemsPerPage(newItemsPerPage)
    setCurrentPage(newPage)
  }

  const goToNextPage = () => {
    goToPage(currentPage + 1)
  }

  const goToPreviousPage = () => {
    goToPage(currentPage - 1)
  }

  const goToFirstPage = () => {
    goToPage(1)
  }

  const goToLastPage = () => {
    goToPage(totalPages)
  }

  const resetPage = () => {
    setCurrentPage(1)
  }

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
