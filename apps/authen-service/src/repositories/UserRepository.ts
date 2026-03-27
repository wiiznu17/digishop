import { User } from "@digishop/db";

export class UserRepository {
  static async findByEmail(email: string) {
    return User.findOne({
      where: { email },
      attributes: ["id", "email", "password", "role"],
    });
  }

  static async findById(id: number) {
    return User.findByPk(id, {
      attributes: ["id", "email", "role"],
    });
  }
}
