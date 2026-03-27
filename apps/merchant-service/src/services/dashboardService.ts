import { AppError } from '../errors/AppError'
import { dashboardRepository } from '../repositories/dashboardRepository'
import { DashboardSummaryResponse } from '../types/dashboard.types'

export class DashboardServiceError extends AppError {
  public readonly body: Record<string, unknown>

  constructor(statusCode: number, body: Record<string, unknown>) {
    super(
      String(body.error ?? body.message ?? 'Dashboard service error'),
      statusCode,
      true,
      body
    )
    this.name = 'DashboardServiceError'
    this.body = body
  }
}

type GetDashboardSummaryInput = {
  storeId?: number
  userSub?: number | string
}

export class DashboardService {
  async getDashboardSummary(
    input: GetDashboardSummaryInput
  ): Promise<DashboardSummaryResponse> {
    const providedStoreId = Number(input.storeId)
    let storeId =
      Number.isFinite(providedStoreId) && providedStoreId > 0
        ? providedStoreId
        : null

    if (!storeId) {
      const ownerUserId = Number(input.userSub)
      if (!Number.isFinite(ownerUserId)) {
        throw new DashboardServiceError(404, { error: 'No store found' })
      }

      const store = await dashboardRepository.findStoreByUserId(ownerUserId)
      if (!store) {
        throw new DashboardServiceError(404, { error: 'No store found' })
      }

      storeId = store.id
    }

    const stats = await dashboardRepository.getDashboardSummaryStats(storeId)

    return {
      totalRevenueMinor: stats.totalRevenueMinor,
      ordersCount: stats.ordersCount,
      productsCount: stats.productsCount,
      activeCustomers: stats.activeCustomers,
      revenueChangeText: stats.revenueChangeText,
      ordersChangeText: stats.ordersChangeText,
      productsChangeText: '—',
      customersChangeText: '—',
      thisMonthSalesCount: stats.thisMonthSalesCount,
      recentSales: stats.recentSales,
      revenueSeries: [],
      conversionRatePct: 3.2,
      aovMinor: stats.aovMinor,
      customerSatisfaction: '4.8/5',
      totalImages: stats.totalImages
    }
  }
}

export const dashboardService = new DashboardService()
