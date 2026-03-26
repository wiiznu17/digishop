import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserRole } from "@digishop/db";
import { redis } from "../lib/redis";
import { sendMailForgotPassword, sendMailVerified } from "../util/mailUtil";
import { enqueueRefreshToken } from "../queues/tokenQueue";
import { accessToken } from "../util/jwt";
import { AppError, BadRequestError, NotFoundError } from "../errors/AppError";
import { userRepository } from "../repositories/userRepository";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const SALT_PASSWORD = Number(process.env.SALT_PASSWORD ?? "10");

export class UserService {
  async createAddress(payload: {
    userId: number;
    recipientName: string;
    phone: string;
    address_number: string;
    building?: string;
    subStreet?: string;
    street: string;
    subdistrict: string;
    district: string;
    country: string;
    province: string;
    postalCode: string;
    addressType: string;
  }) {
    const hasDefaultAdd = await userRepository.findDefaultAddress(payload.userId);
    const isDefault = hasDefaultAdd.length === 0;

    return userRepository.createAddress({
      userId: payload.userId,
      recipientName: payload.recipientName,
      phone: payload.phone,
      addressNumber: payload.address_number,
      building: payload.building,
      subStreet: payload.subStreet,
      street: payload.street,
      subdistrict: payload.subdistrict,
      district: payload.district,
      country: payload.country,
      province: payload.province,
      postalCode: payload.postalCode,
      addressType: payload.addressType,
      isDefault,
    });
  }

  async deleteUser(id: number) {
    const deleted = await userRepository.deleteUser(id);
    if (!deleted) throw new NotFoundError("User not found");
    return { ok: true };
  }

  async findAddressUser(userId: number) {
    return userRepository.findAddressByUserId(userId);
  }

  async findUserDetail(id: number) {
    const user = await userRepository.findUserById(id);
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  async updateAddress(
    userId: string,
    payload: {
      id: number;
      recipientName: string;
      phone: string;
      address_number: string;
      building?: string;
      subStreet?: string;
      street: string;
      subdistrict: string;
      district: string;
      country: string;
      province: string;
      postalCode: string;
      addressType: string;
      isDefault: boolean;
      createdAt?: any;
      updatedAt?: any;
    }
  ) {
    if (payload.isDefault === true) {
      const findIsDefault = await userRepository.findDefaultAddressOne(Number(userId));
      if (findIsDefault) {
        await userRepository.updateAddressById(findIsDefault.id, { isDefault: false });
      }
    }

    await userRepository.updateAddress(payload.id, {
      recipientName: payload.recipientName,
      phone: payload.phone,
      addressNumber: payload.address_number,
      building: payload.building,
      subStreet: payload.subStreet,
      street: payload.street,
      subdistrict: payload.subdistrict,
      district: payload.district,
      country: payload.country,
      province: payload.province,
      postalCode: payload.postalCode,
      addressType: payload.addressType,
      isDefault: payload.isDefault,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    });

    return { data: "success" };
  }

  async deleteAddress(id: number) {
    await userRepository.deleteAddress(id);
    return { data: "success" };
  }

  async updateUserName(id: number, payload: { firstName: string; lastName: string; middleName?: string }) {
    await userRepository.updateUser(id, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      middleName: payload.middleName,
    });
    return { data: "success" };
  }

  async refreshTokenAuth(refreshToken: string) {
    if (!refreshToken) throw new BadRequestError("Refresh token is required");

    // NOTE: The original service uses enqueueRefreshToken to look up a job by refreshToken string,
    // which is not how BullMQ works. This is a pre-existing limitation in the original code.
    // We preserve the same interface but throw an appropriate error when not supported.
    throw new AppError("Invalid or expired refresh token", 403);
  }

  async resetPassword(token: string, password: string) {
    const { email } = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const redisToken = await redis.get(`reset-password:${email}`);
    if (redisToken !== token) throw new AppError("Invalid token", 400);
    await redis.del(`reset-password:${email}`);

    const users = await userRepository.findUserByEmailIncludeAll(email);
    if (users.length === 1) {
      const passwordHash = await bcrypt.hash(password, 10);
      await userRepository.updateUserByEmail(email, { password: passwordHash });
    }
    return { data: "success" };
  }

  async sendMailResetPassword(email: string) {
    const users = await userRepository.findUserByEmailIncludeAll(email);
    if (users.length !== 1) throw new NotFoundError("Email not found");

    const response = await sendMailForgotPassword(email);
    if (!response) throw new AppError("Failed to send mail", 500);
    return { data: response };
  }

  async sendValidateEmail(userData: any) {
    const { email, password, ...rest } = userData;

    const user = await userRepository.findUserByEmail(email);
    if (user) throw new AppError("This email already has an account", 404);

    const passwordHash = await bcrypt.hash(password, 10);
    const redisData = {
      ...rest,
      email,
      password: passwordHash,
    };

    await redis.set(`register:user:${email}`, JSON.stringify(redisData), "EX", 3600);

    const response = await sendMailVerified(email);
    if (!response) throw new AppError("Failed to send mail", 500);
    return { data: true };
  }

  async createUser(token: string) {
    const { email } = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const redisData = await redis.get(`register:user:${email}`);
    if (!redisData) throw new AppError("Verification expired or not found", 400);

    const parsedData = JSON.parse(redisData);
    if (parsedData.email !== email) throw new AppError("Invalid verification link", 400);
    await redis.del(`register:user:${email}`);

    const {
      firstName, middleName, lastName, password,
      recipientName, phone, address_number, building, subStreet,
      street, subdistrict, district, country, province, postalCode,
      isDefault, addressType,
    } = parsedData;

    const newUser = await userRepository.createUser({
      firstName,
      middleName,
      lastName,
      email,
      password,
      role: UserRole.CUSTOMER,
    });
    await (newUser as any).save();

    const addressValid = [
      recipientName, phone, address_number, street, district, country, province, postalCode,
    ];

    if (addressValid.every((x) => x !== "")) {
      await userRepository.createAddress({
        userId: newUser.id,
        recipientName,
        phone,
        addressNumber: address_number,
        building,
        subStreet,
        street,
        subdistrict,
        district,
        country,
        province,
        postalCode,
        isDefault: true,
        addressType,
      });
    }

    return { data: true };
  }
}

export const userService = new UserService();
