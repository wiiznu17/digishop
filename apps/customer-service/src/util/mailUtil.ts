const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET ?? "supersecretkey";

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
export const sendMailVerified = async (user:PayloadProps) => {
  const token = await jwt.sign(user, JWT_SECRET, { expiresIn: "1H" });
  const url = `http://localhost:3000/confirmation/token?=${token}`;
  console.log("email", user.email);
  transporter
    .sendMail({
      from: "digishop080@gmail.com",
      to: `${user.firstName} <${user.email}>`,
      subject: "Confirmation Email",
      html: `Confirmation Email ${url}`,
    })
    .then(() => {
      console.log("Email sent");
    })
    .catch((error: any) => {
      console.log("Email not sent", error.message);
    });
};
export const sendMailForgotPassword = async (email:string): Promise<boolean> => {
  const token = await jwt.sign(email, JWT_SECRET, { expiresIn: "1H" });
  const url = `http://localhost:3000/auth/reset-password?token=${token}`;
  console.log("email", email);
  try {
    await transporter.sendMail({
      from: "digishop080@gmail.com",
      to: `<${email}>`,
      subject: "Reset Password Link",
      html: `click link to reset your password : ${url}`,
    });
    console.log("Email sent");
    return true;
  } catch (error: any) {
    console.log("Email not sent", error.message);
    return false;
  }
};
