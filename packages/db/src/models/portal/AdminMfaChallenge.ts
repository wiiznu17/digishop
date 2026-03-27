import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { MfaChallengeStatus, MfaFactorType } from '../../types/portal'

export interface AdminMfaChallengeAttributes {
  id: number
  adminId: number
  factorType: MfaFactorType
  challengeId: string // uuid
  status: MfaChallengeStatus
  expiresAt: Date
  resolvedAt?: Date | null
  attempts?: number // เพิ่มสำหรับ rate-limit
  metadataJson?: object | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface AdminMfaChallengeCreationAttributes
  extends Optional<
    AdminMfaChallengeAttributes,
    | 'id'
    | 'resolvedAt'
    | 'attempts'
    | 'metadataJson'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class AdminMfaChallenge
  extends Model<
    AdminMfaChallengeAttributes,
    AdminMfaChallengeCreationAttributes
  >
  implements AdminMfaChallengeAttributes
{
  public id!: number
  public adminId!: number
  public factorType!: MfaFactorType
  public challengeId!: string
  public status!: MfaChallengeStatus
  public expiresAt!: Date
  public resolvedAt!: Date | null
  public attempts!: number
  public metadataJson!: object | null
  public createdAt!: Date
  public updatedAt!: Date
  public deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof AdminMfaChallenge {
    AdminMfaChallenge.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        adminId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'admin_id'
        },
        factorType: {
          type: DataTypes.ENUM(...Object.values(MfaFactorType)),
          allowNull: false,
          field: 'factor_type'
        },
        challengeId: {
          type: DataTypes.STRING(36),
          allowNull: false,
          unique: true,
          field: 'challenge_id'
        },
        status: {
          type: DataTypes.ENUM(...Object.values(MfaChallengeStatus)),
          allowNull: false,
          defaultValue: MfaChallengeStatus.PENDING
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'expires_at'
        },
        resolvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'resolved_at'
        },
        attempts: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0
        },
        metadataJson: {
          type: DataTypes.JSON,
          allowNull: true,
          field: 'metadata_json'
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: DataTypes.NOW
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'deleted_at'
        }
      },
      {
        sequelize,
        tableName: 'ADMIN_MFA_CHALLENGES',
        modelName: 'AdminMfaChallenge',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { fields: ['admin_id'] },
          { unique: true, fields: ['challenge_id'] }
        ]
      }
    )
    return AdminMfaChallenge
  }
}
