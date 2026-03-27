import { Op } from 'sequelize'
import { sequelize } from '@digishop/db'
import {
  AppError,
  BadRequestError,
  NotFoundError,
  ConflictError
} from '../errors/AppError'
import { categoryRepository } from '../repositories/categoryRepository'

const asInt = (v: any, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : d
}

export class CategoryService {
  async getDescendantIdsByScan(rootUuid: string): Promise<number[]> {
    const all = await categoryRepository.getAllCategoriesForTree()

    const byUuid = new Map(all.map((c: any) => [c.uuid, c]))
    const byParent = new Map<number | null, number[]>()
    for (const c of all) {
      const arr = byParent.get(c.parentId ?? null) ?? []
      arr.push(c.id)
      byParent.set(c.parentId ?? null, arr)
    }

    const root = byUuid.get(rootUuid)
    if (!root) return []

    const result: number[] = []
    const q: number[] = [root.id]
    while (q.length) {
      const id = q.shift()!
      result.push(id)
      const children = byParent.get(id) ?? []
      for (const cid of children) q.push(cid)
    }
    return result
  }

  async countProductsTotal(rootUuid: string): Promise<number> {
    const ids = await this.getDescendantIdsByScan(rootUuid)
    return categoryRepository.countProductsTotal(ids)
  }

  async listCategories(params: {
    parentUuid?: string
    q?: string
    page?: string
    pageSize?: string
    mode?: 'flat'
  }) {
    const { parentUuid, q, page = '1', pageSize = '20', mode } = params
    const p = asInt(page, 1)
    const ps = asInt(pageSize, 20)

    if (mode === 'flat') {
      const where: any = { deletedAt: null }
      if (q) where.name = { [Op.like]: `%${q}%` }

      const rows: any = await categoryRepository.findAllCategoriesParams(
        where,
        [['name', 'ASC']],
        ['uuid', 'name', 'parentId', 'createdAt', 'updatedAt']
      )

      const parentIds = rows
        .map((r: any) => r.parentId)
        .filter(Boolean) as number[]
      const parents =
        parentIds.length > 0
          ? await categoryRepository.findAllCategoriesByIds(parentIds)
          : []
      const parentById = new Map(parents.map((p: any) => [p.id, p.uuid]))

      const data = rows.map((r: any) => ({
        uuid: r.uuid,
        name: r.name,
        parentUuid: r.parentId ? (parentById.get(r.parentId) ?? null) : null,
        productCountDirect: 0,
        productCountTotal: 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))

      return { data, meta: { total: data.length, totalPages: 1 } }
    }

    let parentId: number | null = null
    if (parentUuid) {
      const pCat: any = await categoryRepository.findCategoryByUuid(parentUuid)
      if (!pCat) throw new NotFoundError('Parent not found')
      parentId = pCat.id
    }

    const where: any = { deletedAt: null, parentId }
    if (q) where.name = { [Op.like]: `%${q}%` }

    const { count, rows } = await categoryRepository.findAndCountCategories(
      where,
      [['name', 'ASC']],
      ps,
      (p - 1) * ps,
      ['id', 'uuid', 'name', 'parentId', 'createdAt', 'updatedAt']
    )

    const parentIds = rows
      .map((r: any) => r.parentId)
      .filter(Boolean) as number[]
    const parents =
      parentIds.length > 0
        ? await categoryRepository.findAllCategoriesByIds(parentIds)
        : []
    const parentById = new Map(parents.map((x: any) => [x.id, x.uuid]))

    const data = await Promise.all(
      rows.map(async (r: any) => {
        const direct = await categoryRepository.countProductsDirect(r.id)
        const total = await this.countProductsTotal(r.uuid)
        return {
          uuid: r.uuid,
          name: r.name,
          parentUuid: r.parentId ? (parentById.get(r.parentId) ?? null) : null,
          productCountDirect: direct,
          productCountTotal: total,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }
      })
    )

    return {
      data,
      meta: { total: count, totalPages: Math.max(1, Math.ceil(count / ps)) }
    }
  }

  async suggestCategories(q: string) {
    const term = String(q || '').trim()
    if (!term) return []
    const rows = await categoryRepository.suggestCategories(
      { deletedAt: null, name: { [Op.like]: `%${term}%` } },
      10,
      [['name', 'ASC']],
      ['uuid', 'name']
    )
    return rows.map((r: any) => ({ uuid: r.uuid, name: r.name }))
  }

  async getCategoryDetail(uuid: string) {
    const row: any = await categoryRepository.findCategoryByUuid(uuid)
    if (!row) throw new NotFoundError('Not found')

    let parentUuid: string | null = null
    if (row.parentId) {
      const p: any = await categoryRepository.findCategoryById(row.parentId)
      parentUuid = p?.uuid ?? null
    }
    return {
      uuid: row.uuid,
      name: row.name,
      parentUuid
    }
  }

  async createCategory(payload: { name: string; parentUuid?: string | null }) {
    const t = await sequelize.transaction()
    try {
      const { name, parentUuid = null } = payload
      if (!name?.trim()) {
        throw new BadRequestError('Name is required')
      }

      let parentId: number | null = null
      if (parentUuid) {
        const p: any = await categoryRepository.findCategoryByUuid(parentUuid)
        if (!p) throw new BadRequestError('Parent not found')
        parentId = p.id
      }

      const uuid = require('crypto').randomUUID()
      const created: any = await categoryRepository.createCategory(
        { uuid, name: name.trim(), parentId },
        t
      )

      await t.commit()
      return { uuid: created.uuid }
    } catch (e) {
      await t.rollback()
      throw e
    }
  }

  async updateCategory(
    uuid: string,
    payload: { name?: string; parentUuid?: string | null }
  ) {
    const t = await sequelize.transaction()
    try {
      const row: any = await categoryRepository.findCategoryByUuid(uuid, t)
      if (!row) throw new NotFoundError('Not found')

      const { name, parentUuid } = payload

      let parentId = row.parentId
      if (parentUuid !== undefined) {
        if (parentUuid === null) parentId = null
        else {
          const p: any = await categoryRepository.findCategoryByUuid(
            parentUuid,
            t
          )
          if (!p) throw new BadRequestError('Parent not found')

          const descIds = await this.getDescendantIdsByScan(row.uuid)
          if (descIds.includes(p.id)) {
            throw new BadRequestError('Cannot set parent to its descendant')
          }
          parentId = p.id
        }
      }

      await row.update(
        {
          name: name?.trim() ?? row.name,
          parentId
        },
        { transaction: t }
      )

      await t.commit()
      return { ok: true }
    } catch (e) {
      await t.rollback()
      throw e
    }
  }

  async deleteCategory(uuid: string) {
    const t = await sequelize.transaction()
    try {
      const row: any = await categoryRepository.findCategoryByUuid(uuid, t)
      if (!row) throw new NotFoundError('Not found')

      const total = await this.countProductsTotal(row.uuid)
      if (total > 0) throw new ConflictError(`CATEGORY_HAS_PRODUCTS ${total}`)

      const ids = await this.getDescendantIdsByScan(row.uuid)
      if (ids.length > 0) {
        await categoryRepository.softDeleteCategories(ids, t)
      }

      await t.commit()
      return { ok: true, deletedCount: ids.length }
    } catch (e) {
      if (
        e instanceof ConflictError &&
        e.message.startsWith('CATEGORY_HAS_PRODUCTS')
      ) {
        const total = e.message.split(' ')[1]
        throw new ConflictError(`CATEGORY_HAS_PRODUCTS`)
      }
      await t.rollback()
      throw e
    }
  }

  async moveProducts(uuid: string, targetCategoryUuid: string) {
    const t = await sequelize.transaction()
    try {
      const src: any = await categoryRepository.findCategoryByUuid(uuid, t)
      const dst: any = await categoryRepository.findCategoryByUuid(
        targetCategoryUuid,
        t
      )

      if (!src || !dst) throw new BadRequestError('Source or target not found')
      if (src.uuid === dst.uuid)
        throw new BadRequestError('Target must be different from source')

      const descIds = await this.getDescendantIdsByScan(src.uuid)
      if (descIds.includes(dst.id)) {
        throw new BadRequestError('Target cannot be a descendant of source')
      }

      const [affected] = await categoryRepository.moveProducts(
        descIds,
        dst.id,
        t
      )

      await t.commit()
      return { ok: true, moved: Number(affected ?? 0) }
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}

export const categoryService = new CategoryService()
