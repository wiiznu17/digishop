import bcrypt from 'bcrypt'
import { Op } from 'sequelize'
import { addHours, genTokenRaw, sha256b64 } from '../lib/tokens'
import { sendAdminInvite, sendAdminReset } from '../helpers/mailer'
import {
  AppError,
  BadRequestError,
  ForbiddenError,
  NotFoundError
} from '../errors/AppError'
import { adminCredentialRepository } from '../repositories/adminCredentialRepository'

const INVITE_TTL_HOURS = 48
const RESET_TTL_HOURS = 2
const ROUNDS = process.env.NODE_ENV === 'production' ? 12 : 10
const REINVITE_COOLDOWN_MIN = 10

export class AdminCredentialService {
  async sendInviteById(id: number, inviterId: number | undefined) {
    if (!Number.isFinite(id)) throw new BadRequestError('Invalid id')
    if (!inviterId) throw new ForbiddenError('Forbidden') // For backward compatibility mapping

    const admin: any = await adminCredentialRepository.findAdminById(id)
    if (!admin) throw new NotFoundError('Admin not found')

    const email = String(admin.get('email') || '')
    const status = String(admin.get('status') || '')
    const hasPassword = Boolean(admin.get('password'))

    if (hasPassword || status === 'ACTIVE') {
      throw new BadRequestError('ALREADY_ACCEPTED')
    }

    const cooldownSince = new Date(
      Date.now() - REINVITE_COOLDOWN_MIN * 60 * 1000
    )
    const recentUnaccepted =
      await adminCredentialRepository.findRecentUnacceptedInvite(
        email,
        cooldownSince
      )

    if (recentUnaccepted) {
      throw new AppError('TOO_FREQUENT', 429) // AppError pattern handles this
    }

    await adminCredentialRepository.clearPendingInvites(email)

    const userRoles = await adminCredentialRepository.findUserRolesByAdminId(id)
    let roleSlugDefault: string | null = null
    if (userRoles.length > 0) {
      const role = await adminCredentialRepository.findRoleById(
        userRoles[0].get('roleId') as number
      )
      roleSlugDefault = role ? (role.get('slug') as string) : null
    }

    const raw = genTokenRaw()
    const tokenHash = sha256b64(raw)
    const expiresAt = addHours(INVITE_TTL_HOURS)

    await adminCredentialRepository.createInvite({
      email,
      invitedByAdminId: inviterId,
      tokenHash,
      roleSlugDefault,
      expiresAt
    })

    await sendAdminInvite(email, String(admin.get('name') ?? ''), raw)
    return { ok: true }
  }

  async resetPasswordById(id: number) {
    if (!Number.isFinite(id)) throw new BadRequestError('Invalid id')

    const admin: any = await adminCredentialRepository.findAdminById(id)
    if (!admin) throw new NotFoundError('Admin not found')

    const hasPassword = Boolean(admin.get('password'))
    if (!hasPassword) {
      throw new BadRequestError('NOT_ACCEPTED_YET')
    }

    await adminCredentialRepository.clearPendingResets(id)

    const raw = genTokenRaw()
    const tokenHash = sha256b64(raw)
    const expiresAt = addHours(RESET_TTL_HOURS)

    await adminCredentialRepository.createPasswordReset({
      adminId: id,
      tokenHash,
      expiresAt
    })

    await sendAdminReset(
      String(admin.get('email')),
      String(admin.get('name') ?? ''),
      raw
    )
    return { ok: true }
  }

  async acceptInvite(payload: {
    token?: string
    name?: string
    password?: string
  }) {
    const { token, name, password } = payload
    if (!token || !password) throw new BadRequestError('Missing token/password')

    const tokenHash = sha256b64(token)
    const invite: any =
      await adminCredentialRepository.findInviteByTokenHash(tokenHash)
    if (!invite) throw new BadRequestError('INVALID_TOKEN')

    const now = new Date()
    const expiresAt = invite.get('expiresAt') as Date
    const acceptedAt = invite.get('acceptedAt') as Date | null

    if (acceptedAt) throw new BadRequestError('TOKEN_USED')
    if (expiresAt.getTime() < now.getTime())
      throw new BadRequestError('TOKEN_EXPIRED')

    const email = String(invite.get('email'))
    const passwordHash = await bcrypt.hash(password, ROUNDS)

    let admin: any =
      await adminCredentialRepository.findAdminByEmailIncludeDeleted(email)
    if (!admin) {
      admin = await adminCredentialRepository.createAdmin({
        email,
        name: name ?? email.split('@')[0],
        password: passwordHash,
        status: 'ACTIVE',
        lastLoginAt: null
      })
    } else {
      await admin.update({ password: passwordHash, status: 'ACTIVE' })
    }

    const roleSlugDefault = invite.get('roleSlugDefault') as string | null
    if (roleSlugDefault) {
      const role =
        await adminCredentialRepository.findRoleBySlug(roleSlugDefault)
      if (role) {
        await adminCredentialRepository.findOrCreateUserRole(
          admin.get('id'),
          role.get('id') as number
        )
      }
    }

    await invite.update({ acceptedAt: now })
    return { ok: true }
  }

  async performReset(payload: { token?: string; password?: string }) {
    const { token, password } = payload
    if (!token || !password) throw new BadRequestError('Missing token/password')

    const tokenHash = sha256b64(token)
    const rec: any =
      await adminCredentialRepository.findResetByTokenHash(tokenHash)
    if (!rec) throw new BadRequestError('INVALID_TOKEN')

    const now = new Date()
    const expiresAt = rec.get('expiresAt') as Date
    const usedAt = rec.get('usedAt') as Date | null

    if (usedAt) throw new BadRequestError('TOKEN_USED')
    if (expiresAt.getTime() < now.getTime())
      throw new BadRequestError('TOKEN_EXPIRED')

    const adminId = rec.get('adminId') as number
    const admin: any = await adminCredentialRepository.findAdminById(adminId)
    if (!admin) throw new NotFoundError('Admin not found')

    const passwordHash = await bcrypt.hash(password, ROUNDS)
    await admin.update({ password: passwordHash })
    await rec.update({ usedAt: now })

    return { ok: true }
  }
}

export const adminCredentialService = new AdminCredentialService()
