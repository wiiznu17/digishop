import { resolveRedirectPath } from '@/contexts/auth-routing'
import type { StoreStatus, UserAuth } from '@/types/props/userProp'

function createUser(role: UserAuth['role'] = 'MERCHANT'): UserAuth {
  return {
    id: 1,
    email: 'merchant@example.com',
    role
  }
}

describe('resolveRedirectPath', () => {
  it('allows unauthenticated users to stay on login', () => {
    expect(resolveRedirectPath('/login', null, null)).toBeNull()
  })

  it('redirects merchant users away from login to store status when pending', () => {
    expect(
      resolveRedirectPath('/login', createUser(), 'PENDING' as StoreStatus)
    ).toBe('/store-status?status=PENDING')
  })

  it('redirects approved merchants from login to merchant home', () => {
    expect(
      resolveRedirectPath('/login', createUser(), 'APPROVED' as StoreStatus)
    ).toBe('/orders')
  })

  it('redirects customers from login to register', () => {
    expect(resolveRedirectPath('/login', createUser('CUSTOMER'), null)).toBe(
      '/register'
    )
  })

  it('redirects unauthenticated users from register to login', () => {
    expect(resolveRedirectPath('/register', null, null)).toBe('/login')
  })

  it('allows customers to remain on register', () => {
    expect(resolveRedirectPath('/register', createUser('CUSTOMER'), null)).toBe(
      null
    )
  })

  it('keeps merchants on store status when not approved', () => {
    expect(
      resolveRedirectPath(
        '/store-status?status=PENDING',
        createUser(),
        'PENDING' as StoreStatus
      )
    ).toBeNull()
  })

  it('redirects approved merchants away from store status', () => {
    expect(
      resolveRedirectPath(
        '/store-status?status=APPROVED',
        createUser(),
        'APPROVED' as StoreStatus
      )
    ).toBe('/orders')
  })

  it('protects private merchant pages for unauthenticated users', () => {
    expect(resolveRedirectPath('/orders', null, null)).toBe('/login')
  })

  it('redirects customers away from private merchant pages', () => {
    expect(resolveRedirectPath('/orders', createUser('CUSTOMER'), null)).toBe(
      '/register'
    )
  })

  it('redirects non-approved merchants from private pages to store status', () => {
    expect(
      resolveRedirectPath('/orders', createUser(), 'BANNED' as StoreStatus)
    ).toBe('/store-status?status=BANNED')
  })

  it('allows approved merchants onto private pages', () => {
    expect(
      resolveRedirectPath('/orders', createUser(), 'APPROVED' as StoreStatus)
    ).toBeNull()
  })
})
