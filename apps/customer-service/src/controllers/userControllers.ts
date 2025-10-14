import { User } from "@digishop/db/src/models/User";
import { Address } from "@digishop/db/src/models/Address";
import { AddressType, UserRole } from "@digishop/db/src/types/enum";
import { Request, Response } from "express";
import { Op } from "@digishop/db/src/db";
import bcrypt from "bcrypt"
import jwt, { JwtPayload } from "jsonwebtoken"
import nodemailer from "nodemailer";
// import sgTransport from "nodemailer-sendgrid-transport";
const JWT_SECRET = process.env.JWT_SECRET ?? 'supersecretkey'

export const createUser = async (req: Request, res: Response) => {
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
  const addressValide = [recipientName,phone,address_number,street,district,country,province,postalCode]
  try {
    // หา user จาก userId
    const user = await User.findByPk(email);
    if (user) {
      return res
        .status(404)
        .json({ error: "This email already have an account" });
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const newUser = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password: passwordHash,
      role: UserRole.CUSTOMER,
    });
    await newUser.save();
    if(addressValide.every(x => x !== '') ){
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
      await address.save()
    }
    const payload = {
      firstName: newUser.firstName,
      middleName: newUser.middleName,
      lastName: newUser.lastName,
      email: newUser.email
    }
    const token = await jwt.sign(payload, JWT_SECRET, { expiresIn: "1H" })
    const transport = nodemailer.createTransport(
      nodemailerSendgrid({
        apiKey: process.env.SENDGRED_API
      })
    )
    const url = `http://localhost:3000/confirmation/token?=${token}`
    transport.sendMail({
      from: 'no-reply@digishop.com',
      to: `${newUser.firstName} <${newUser.email}>`,
      subject: 'Confirmation Email',
      html:`Confirmation Email <a href=${url}> ${url}`
    }).then(() => {
      console.log("Email sent")
    }).catch(() => {
      console.log("Email not sent")
    })
    res.json({ data: newUser , token: token });
  } catch (err: any) {
    console.log(err.message)
    res.status(400).json({ error: err });
  }
};

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
    const hasDefaultAdd = await Address.findAll({where: {
      [Op.and]: {
        userId: userId,
        isDefault: true
      }
    }})
    let isDefault
    console.log('has',hasDefaultAdd)
    if(hasDefaultAdd.length === 0){
      isDefault = true
    }else{
      isDefault = false
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
    res.json({data: 'success'})
  } catch (error) {
    console.log(error.message)
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  const id = req.params.id;
  console.log(id)
  try {
    await Address.destroy({
      where: { id: id },
    });
    res.json({data: 'success'})
  } catch (error) {
    console.log(error.message)    
  }
};

export const updateUserName = async ( req: Request, res: Response) => {
  const id = req.params.id
  const {
    firstName,
    lastName,
    middleName
  } = req.body
  try {
    await User.update({
      firstName: firstName,
      lastName: lastName,
      middleName: middleName
    }, { where: { id: id}})
    res.json({data: 'success'})
  } catch (error) {
    console.log(error.message)
  }
}

function nodemailerSendgrid(arg0: { apiKey: string | undefined; }): import("nodemailer/lib/smtp-pool") | import("nodemailer/lib/smtp-pool").Options {
  throw new Error("Function not implemented.");
}
