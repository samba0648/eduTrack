import emailjs from "@emailjs/nodejs";
import dotenv from "dotenv";

dotenv.config();

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID!;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID!;
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY!;

export const sendEmailNotification = async (
  toEmail: string,
  userName: string,
  status: string,
  today: string
) => {
  try {
    console.log('toEmail', toEmail);
    const templateParams = {
      user_email: toEmail,
      user_name: userName,
      attendance_status: status,
      date: today
    };

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
      publicKey: PUBLIC_KEY,
      privateKey: PRIVATE_KEY
    });

    console.log(`Email sent to ${toEmail} - ${status}`);
  } catch (error) {
    console.error("Error sending email via EmailJS:", error);
  }
};
