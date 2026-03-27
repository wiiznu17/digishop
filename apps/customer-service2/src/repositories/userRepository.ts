import { Address, User, UserRole } from '@digishop/db'
import { Op } from 'sequelize'

export class UserRepository {
  async findUserByEmail(email: string) {
    return User.findOne({ where: { email } })
  }

  async findUserById(id: number) {
    return User.findByPk(id)
  }

  async findUserByEmailIncludeAll(email: string) {
    return User.findAll({ where: { email } })
  }

  async createUser(payload: any) {
    return User.create(payload)
  }

  async updateUser(id: number, payload: any) {
    return User.update(payload, { where: { id } })
  }

  async updateUserByEmail(email: string, payload: any) {
    return User.update(payload, { where: { email } })
  }

  async deleteUser(id: number) {
    return User.destroy({ where: { id } })
  }

  async findDefaultAddress(userId: number) {
    return Address.findAll({
      where: {
        [Op.and]: {
          userId,
          isDefault: true
        }
      }
    })
  }

  async findDefaultAddressOne(userId: number) {
    return Address.findOne({
      where: {
        [Op.and]: {
          userId,
          isDefault: true
        }
      }
    })
  }

  async findAddressByUserId(userId: number) {
    return Address.findAll({
      where: { userId },
      attributes: [
        'id',
        'recipientName',
        'phone',
        'province',
        'postalCode',
        'isDefault',
        'addressType',
        'address_number',
        'building',
        'subStreet',
        'street',
        'subdistrict',
        'district',
        'country'
      ]
    })
  }

  async createAddress(payload: any) {
    const address = await Address.create(payload)
    await address.save()
    return address
  }

  async updateAddress(id: number, payload: any) {
    return Address.update(payload, { where: { id } })
  }

  async updateAddressById(id: number, payload: any) {
    return Address.update(payload, { where: { id } })
  }

  async deleteAddress(id: number) {
    return Address.destroy({ where: { id } })
  }
}

export const userRepository = new UserRepository()
