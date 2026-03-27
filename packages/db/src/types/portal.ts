export enum AdminUserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum MfaFactorType {
  TOTP = 'TOTP',
  WEBAUTHN = 'WEBAUTHN',
  SMS = 'SMS'
}

export enum MfaFactorStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

export enum MfaChallengeStatus {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED'
}

export enum PermissionEffect {
  ALLOW = 'ALLOW',
  DENY = 'DENY'
}
