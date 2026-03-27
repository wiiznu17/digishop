import { Op, col, fn } from 'sequelize'
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError
} from '../errors/AppError'
import { adminRoleRepository } from '../repositories/adminRoleRepository'

const asInt = (v: any, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : d
}
const likeify = (q: string) => `%${q.replace(/[%_]/g, '\\$&')}%`

export class AdminRoleService {
  async listRoles(params: Record<string, string | undefined>) {
    const { q = '', sortBy = 'createdAt', sortDir = 'desc' } = params

    const page = Math.max(asInt(params.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(params.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize

    const where: any = {}
    if (q && q.trim()) {
      const t = likeify(q.trim())
      where[Op.or] = [{ name: { [Op.like]: t } }, { slug: { [Op.like]: t } }]
    }

    const dir = String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const orderBy: any[] = []
    if (sortBy === 'name') orderBy.push([col('AdminRole.name'), dir])
    else if (sortBy === 'slug') orderBy.push([col('AdminRole.slug'), dir])
    else orderBy.push([col('AdminRole.created_at'), dir])

    const attributes = [
      'id',
      ['slug', 'slug'],
      ['name', 'name'],
      ['description', 'description'],
      ['is_system', 'isSystem'],
      ['created_at', 'createdAt'],
      [fn('COUNT', col('rolePermissions.id')), 'permissionCount']
    ]
    const group = ['AdminRole.id']

    const { rows, count } = await adminRoleRepository.findAndCountRoles(
      where,
      orderBy,
      offset,
      pageSize,
      attributes,
      group
    )

    const data = rows.map((r: any) => ({
      id: r.get('id'),
      slug: r.get('slug'),
      name: r.get('name'),
      description: r.get('description'),
      isSystem: !!r.get('isSystem'),
      permissionCount: Number(r.get('permissionCount') ?? 0),
      createdAt: r.get('createdAt')
    }))

    const total = Array.isArray(count) ? count.length : (count as number)
    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    }
  }

  async getRoleDetail(id: number) {
    if (!Number.isFinite(id)) throw new BadRequestError('Invalid id')

    const role = await adminRoleRepository.findRoleById(id)
    if (!role) throw new NotFoundError('Not found')

    const allPermissions = await adminRoleRepository.findAllPermissions()

    return {
      id: role.get('id'),
      slug: role.get('slug'),
      name: role.get('name'),
      description: role.get('description'),
      isSystem: !!role.get('isSystem'),
      createdAt: role.get('createdAt'),
      updatedAt: role.get('updatedAt'),
      permissions:
        (role as any).permissions?.map((p: any) => ({
          id: p.get('id'),
          slug: p.get('slug'),
          resource: p.get('resource'),
          action: p.get('action'),
          effect: p.get('effect')
        })) ?? [],
      allPermissions: allPermissions.map((p: any) => ({
        id: p.get('id'),
        slug: p.get('slug'),
        resource: p.get('resource'),
        action: p.get('action'),
        effect: p.get('effect')
      }))
    }
  }

  async createRole(payload: {
    slug?: string
    name?: string
    description?: string
  }) {
    const { slug, name, description } = payload
    if (!slug || !name) throw new BadRequestError('Missing fields (slug, name)')

    const existed = await adminRoleRepository.countRolesBySlug(slug)
    if (existed > 0) throw new ConflictError('Slug already exists')

    const created = await adminRoleRepository.createRole({
      slug,
      name,
      description: description ?? null,
      isSystem: false
    })
    return { id: created.get('id') }
  }

  async updateRoleMeta(
    id: number,
    payload: { name?: string; description?: string }
  ) {
    if (!Number.isFinite(id)) throw new BadRequestError('Invalid id')
    const { name, description } = payload

    const role: any = await adminRoleRepository.findSimpleRoleById(id)
    if (!role) throw new NotFoundError('Not found')
    if (role.get('isSystem'))
      throw new BadRequestError('System role is not editable')

    if (name != null) role.set('name', name)
    if (description !== undefined) role.set('description', description || null)
    await role.save()

    return { ok: true }
  }

  async replaceRolePermissions(
    id: number,
    payload: { permissionIds?: number[]; permissionSlugs?: string[] }
  ) {
    if (!Number.isFinite(id)) throw new BadRequestError('Invalid id')

    const role: any = await adminRoleRepository.findSimpleRoleById(id)
    if (!role) throw new NotFoundError('Not found')
    if (role.get('isSystem'))
      throw new BadRequestError('System role is not editable')

    let perms: any[] = []
    if (
      Array.isArray(payload.permissionIds) &&
      payload.permissionIds.length > 0
    ) {
      perms = await adminRoleRepository.findPermissionsByIds(
        payload.permissionIds
      )
    } else if (
      Array.isArray(payload.permissionSlugs) &&
      payload.permissionSlugs.length > 0
    ) {
      perms = await adminRoleRepository.findPermissionsBySlugs(
        payload.permissionSlugs
      )
    }

    await adminRoleRepository.destroyRolePermissions(id)
    if (perms.length > 0) {
      await adminRoleRepository.bulkCreateRolePermissions(
        perms.map((p: any) => ({
          roleId: id,
          permissionId: p.get('id') as number
        }))
      )
    }

    return { ok: true }
  }
}

export const adminRoleService = new AdminRoleService()
