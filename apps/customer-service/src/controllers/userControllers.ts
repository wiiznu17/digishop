import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import nodemailer from "nodemailer";
// import sgTransport from "nodemailer-sendgrid-transport";
import { sendMailForgotPassword, sendMailVerified } from "../util/mailUtil";
import { enqueueRefreshToken } from "../queues/tokenQueue";
import { accessToken } from "../util/jwt";
import { Address, Op, User, UserRole } from "@digishop/db";
// import Redis from "ioredis";
// const redis = new Redis();
import IORedis from "ioredis";
const JWT_SECRET = process.env.JWT_SECRET ?? "";
const SALT_PASSWORD = process.env.SALT_PASSWORD ?? "10";
const REDIS_URL = process.env.REDIS_URL||"" ;
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });




export const createAddress = async (req: Request, res: Response) => {
  const {
    userId,
    recipientName,
    phone,
    address_number,
    building,
    subStreet,
    street,
    subdistrict,
    district,
    country,
    province,
    postalCode,
    addressType,
    createdAt,
    updatedAt,
  } = req.body;
  try {
    const hasDefaultAdd = await Address.findAll({
      where: {
        [Op.and]: {
          userId: userId,
          isDefault: true,
        },
      },
    });
    let isDefault;
    if (hasDefaultAdd.length === 0) {
      isDefault = true;
    } else {
      isDefault = false;
    }
    const address = await Address.create({
      userId,
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
      addressType,
      isDefault,
    });
    await address.save();
    return res.status(200).json({ data: address });
  } catch (err) {
    res.status(500).json({ err: err });
  }
};
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await User.destroy({ where: { id } });
  if (deleted) {
    res.status(204).send();
  } else {
    res.status(404).json({ error: "User not found" });
  }
};
export const findaddressUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const addressData = await Address.findAll({
      where: { userId: id },
      attributes: [
        "id",
        "recipientName",
        "phone",
        "province",
        "postalCode",
        "isDefault",
        "addressType",
        "address_number",
        "building",
        "subStreet",
        "street",
        "subdistrict",
        "district",
        "country",
      ],
    });
    return res.status(200).json({ data: addressData });
  } catch (error) {
    return res.json({ err: error });
  }
};
export const finduserDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userData = await User.findByPk(id);
  return res.status(200).json({ data: userData });
};
export const updateAddress = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const {
    id,
    recipientName,
    phone,
    address_number,
    building,
    subStreet,
    street,
    subdistrict,
    district,
    country,
    province,
    postalCode,
    addressType,
    isDefault,
    createdAt,
    updatedAt,
  } = req.body;
  try {
    if (isDefault === true) {
      const findIsDefault = await Address.findOne({
        where: {
          [Op.and]: {
            userId: userId,
            isDefault: true,
          },
        },
      });
      if (findIsDefault) {
        await Address.update(
          {
            isDefault: false,
          },
          { where: { id: findIsDefault.id } }
        );
      }
    }
    await Address.update(
      {
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
        addressType,
        isDefault,
        createdAt,
        updatedAt,
      },
      {
        where: { id: id },
      }
    );
    res.json({ data: "success" });
  } catch (error: any) {
    res.json({ error: error });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    await Address.destroy({
      where: { id: id },
    });
    res.json({ data: "success" });
  } catch (error: any) {
    res.json({ error: error });
  }
};

export const updateUserName = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { firstName, lastName, middleName } = req.body;
  try {
    await User.update(
      {
        firstName: firstName,
        lastName: lastName,
        middleName: middleName,
      },
      { where: { id: id } }
    );
    res.json({ data: "success" });
  } catch (error: any) {
     res.json({ error: error });
  }
};

export const refreshTokenAuth = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token is required" });
    return;
  }

  try {
    // Replace with correct method to get job by refreshToken
    const job = await enqueueRefreshToken(refreshToken);
    if (!job) {
      res.status(403).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const { userId } = job.data;
    const user = await User.findByPk(userId);

    if (!user) {
      await job.remove(); // Remove job if user not found
      res.status(403).json({ error: "User not found" });
      return;
    }

    const accesstoken = accessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const newrefreshtoken = refreshToken();
    // Remove old refresh token and add new one
    await job.remove();
    await enqueueRefreshToken({
      userId: user.id,
      refreshToken: newrefreshtoken,
    });
    res.json({ accessToken: accesstoken, refreshToken: newrefreshtoken });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { password, token } = req.body;
  try {
    const { email } = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const redisToken = await connection.get(`reset-password:${email}`);
    if (redisToken !== token) throw new Error("Invalid token");
    await connection.del(`reset-password:${email}`);
    const updatePassword = await User.findAll({ where: { email } });
    if (updatePassword.length === 1) {
      const passwordHash = await bcrypt.hash(password, 10);
      await User.update({ password: passwordHash }, { where: { email } });
    }
    res.json({ data: "success" });
  } catch (err) {
    res.json({ err: "Invalid or expired token" });
  }
};

//       const query = {
//         include: [
//           {
//             model: model.USER_RESET_PASSWORD_TOKEN,
//             required: true,
//             where: { token }
//           }
//         ]
//       }
//       model.USER.findOne(query)
//         .then((user) => {
//           if (!user) {
//             throw new ServiceError(userError.ERR_USER_INVALID_RESET_PASSWORD_TOKEN)
//           }
//           if (user.status === userStatusMaster.SUSPEND) {
//             throw new ServiceError(userError.ERR_USER_SUSPEND)
//           }
//           req.user = user.toJSON()
//           next()
//         })
//         .catch((err) => next(err))

export const sendMailResetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const findEmail = await User.findAll({ where: { email } });
    if (findEmail.length === 1) {
      const response = await sendMailForgotPassword(email);
      if (response) {
        res.json({ data: response });
      } else {
        res.json({ error: "not send mail" });
      }
    }
  } catch (error: any) {
    res.json({ error: error });
  }
};

export const sendvaildateEmail = async (req: Request, res: Response) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    password,
    recipientName,
    phone,
    address_number,
    building,
    subStreet,
    street,
    subdistrict,
    district,
    country,
    province,
    postalCode,
    isDefault,
    addressType,
  } = req.body;
   const user = await User.findByPk(email);
    if (user) {
      return res
        .status(404)
        .json({ error: "This email already have an account" });
    }
  const passwordHash = await bcrypt.hash(password, 10);
  const userData = {
    firstName,
    middleName,
    lastName,
    email,
    password: passwordHash,
    recipientName,
    phone,
    address_number,
    building,
    subStreet,
    street,
    subdistrict,
    district,
    country,
    province,
    postalCode,
    isDefault,
    addressType,
  };
  await connection.set(
    `register:user:${email}`,
    JSON.stringify(userData),
    "EX",
    3600 
  );
  const redisData = await connection.get(`register:user:${email}`);
  try {
    const response = await sendMailVerified(email);
    if (response) {
      res.json({ data: response });
    } else {
      res.json({ error: "not send mail" });
    }
  } catch (error: any) {
    res.json({ error: error });
  }
};
export const createUser = async (req: Request, res: Response) => {
  const { token } = req.body;
  try {
    const { email } = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const redisData = await connection.get(`register:user:${email}`);
    if(!redisData)  return res.status(400).json({ success: false, message: "Verification expired or not found" });
    const redisDataRaw = JSON.parse(redisData);
    if (redisDataRaw.email !== email || !redisData) return res.status(400).json({ success: false, message: "Invalid verification link" });
    await connection.del(`register:user:${email}`);
    const {
    firstName,
    middleName,
    lastName,
    password,
    recipientName,
    phone,
    address_number,
    building,
    subStreet,
    street,
    subdistrict,
    district,
    country,
    province,
    postalCode,
    isDefault,
    addressType,
    } = JSON.parse(redisData);
    
  const addressValide = [
    recipientName,
    phone,
    address_number,
    street,
    district,
    country,
    province,
    postalCode,
  ];

    const newUser = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password,
      role: UserRole.CUSTOMER,
    });
    await newUser.save();
    if (addressValide.every((x) => x !== "")) {
      const address = await Address.create({
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
      await address.save();
    }
    res.json({ data: true })
  } catch (err: any) {
    res.status(400).json({ error: err });
  }
};

  