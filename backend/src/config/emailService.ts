import emailjs from "@emailjs/nodejs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail App Password
  },
});

export const sendEmailWithNodemailer = async (
  toEmail: string,
  userName: string,
  attendanceStatus: string,
  date: string
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `Attendance update for ${date}`,
    html: `Hello <b><i>${userName}</i></b>,<br />Your attendance has been marked as <b>${attendanceStatus}</b> on ${date}.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};