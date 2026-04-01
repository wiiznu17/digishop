import { User } from '@digishop/db'

export class UserRepository {
  static async findByEmail(email: string) {
    return User.findOne({
      where: { email },
      attributes: ['id', 'email', 'password', 'role', 'googleId']
    })
  }

  static async findByGoogleId(googleId: string) {
    return User.findOne({
      where: { googleId },
      attributes: ['id', 'email', 'password', 'role', 'googleId']
    })
  }

  static async findById(id: number) {
    return User.findByPk(id, {
      attributes: ['id', 'email', 'role', 'googleId']
    })
  }

  static async create(data: any) {
    return User.create(data)
  }

  static async update(id: number, data: any) {
    return User.update(data, { where: { id } })
  }
}
