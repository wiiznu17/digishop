const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET ?? "";
import { redis } from '../lib/redis'


const transporter = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: process.env.SENDGRED_API,
  })
);
interface PayloadProps {
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
}
export const sendMailVerified = async (email:string) => {
  const token = await jwt.sign({email}, JWT_SECRET, { expiresIn: "1H" });
  const url = `${process.env.WEBSITE_CUSTOMER_URL}/auth/confirmation?token=${token}`;
  try {
    await transporter.sendMail({
      from: "digishop080@gmail.com",
      to: `${email} <${email}>`,
      subject: "Verified Email",
      
      html: `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 500px;
      margin: auto;
      border: 1px solid #eaeaea;
      border-radius: 10px;
      padding: 24px;
      background-color: #f9f9f9;
      color: #333;
    ">
      <h2 style="text-align: center; color: #4a90e2;">Verify Your Email Address</h2>
      <p style="font-size: 15px; line-height: 1.6;">
        This is a verified Email. Please click the button below to continue:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" 
          style="
            background-color: #4a90e2;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
          ">
          Click link to verified this mail.
        </a>
      </div>
      
      <p style="font-size: 13px; color: #999; margin-top: 30px; text-align: center;">
        This link will expire in 1 hour.
      </p>
    </div>
  `,
    });
    return true;
  } catch (error: any) {
    return false;
  }
};
export const sendMailForgotPassword = async (email:string): Promise<boolean> => {
  const token = await jwt.sign({email}, JWT_SECRET, { expiresIn: '1h' });
  await redis.set(`reset-password:${email}`, token, "EX", 3600);
  const url = `${process.env.WEBSITE_CUSTOMER_URL}/auth/reset-password?token=${token}`;
  try {
    await transporter.sendMail({
      from: "digishop080@gmail.com",
      to: `${ email} <${email}>`,
      subject: "Reset Password Link",
      html: `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 500px;
      margin: auto;
      border: 1px solid #eaeaea;
      border-radius: 10px;
      padding: 24px;
      background-color: #f9f9f9;
      color: #333;
    ">
      <h2 style="text-align: center; color: #4a90e2;">Reset Your Password</h2>
      <p style="font-size: 15px; line-height: 1.6;">
        You requested to reset your password. Please click the button below to continue:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" 
          style="
            background-color: #4a90e2;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
          ">
          Click here to reset password
        </a>
      </div>
      
      <p style="font-size: 13px; color: #999; margin-top: 30px; text-align: center;">
        This link will expire in 1 hour.
      </p>
    </div>
  `,
    });
    return true;
  } catch (error: any) {
    return false;
  }
};
