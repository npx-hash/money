import nodemailer from "nodemailer";
import { getEnv } from "@/core/env";

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const env = getEnv();

  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendEmail(args: SendEmailArgs) {
  const env = getEnv();
  const tx = getTransporter();

  if (!tx || !env.SMTP_FROM) {
    console.log("Email skipped (SMTP not configured)", args);
    return { delivered: false };
  }

  await tx.sendMail({
    from: env.SMTP_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
  });

  return { delivered: true };
}
