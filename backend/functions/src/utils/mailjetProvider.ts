import Mailjet from "node-mailjet";
import {env} from "../config/env";
import type {EmailProvider, SendEmailInput} from "./emailProvider";
import {AppError} from "./appError";
import {ErrorCode} from "./errorCodes";

type MailjetClient = ReturnType<typeof Mailjet.apiConnect> | null;

interface MailjetRecipient {
  Email: string;
}

interface MailjetMessage {
  From: {
    Email: string;
    Name?: string;
  };
  To: MailjetRecipient[];
  Subject: string;
  HTMLPart: string;
  TextPart?: string;
  SandboxMode?: boolean;
}

interface MailjetErrorEntry {
  ErrorCode?: string | number;
  ErrorMessage?: string;
  StatusCode?: number;
}

interface MailjetResponseMessage {
  Status?: string;
  Errors?: MailjetErrorEntry[];
  To?: Array<{
    Email: string;
    MessageUUID?: string;
    MessageID?: number;
    MessageHref?: string;
  }>;
}

interface MailjetResponse {
  body?: {
    Messages?: MailjetResponseMessage[];
  };
}

export class MailjetProvider implements EmailProvider {
  private readonly client: MailjetClient;

  constructor() {
    if (env.mailjetApiKey && env.mailjetApiSecret) {
      this.client = Mailjet.apiConnect(env.mailjetApiKey, env.mailjetApiSecret);
    } else {
      this.client = null;
    }
  }

  async send(input: SendEmailInput): Promise<void> {
    // CRITICAL: In test environment, NEVER initialize or call Mailjet SDK
    if (process.env.NODE_ENV === "test" || env.nodeEnv === "test") {
      console.log(`[MockEmail] To: ${input.to}, Subject: ${input.subject}`);
      return;
    }

    if (!this.client) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, "Mailjet credentials are not configured");
    }

    const recipients = (Array.isArray(input.to) ? input.to : [input.to])
      .filter((email): email is string => Boolean(email))
      .map<MailjetRecipient>((email) => ({Email: email}));

    if (recipients.length === 0) {
      throw new Error("MailjetProvider requires at least one recipient");
    }

    const fromEmail = input.from ?? env.emailFrom;
    if (!fromEmail) {
      throw new Error("EMAIL_FROM is not configured");
    }

    const message: MailjetMessage = {
      From: {
        Email: fromEmail,
        ...(env.emailFromName ? {Name: env.emailFromName} : {}),
      },
      To: recipients,
      Subject: input.subject,
      HTMLPart: input.html,
      ...(input.text ? {TextPart: input.text} : {}),
    };

    try {
      const result = (await this.client
        .post("send", {version: "v3.1"})
        .request({Messages: [message]})) as MailjetResponse;

      const responseMessage = result.body?.Messages?.[0];
      const status = responseMessage?.Status;
      if (status !== "success") {
        const errors = responseMessage?.Errors?.length
          ? JSON.stringify(responseMessage.Errors)
          : "unknown error";
        throw new Error(`Mailjet send failed: ${errors}`);
      }

      const messageIds = (responseMessage?.To ?? [])
        .map((entry) => entry.MessageID)
        .filter((id): id is number => typeof id === "number");
      console.info("[mailjet] Email sent", {
        subject: input.subject,
        recipients: recipients.length,
        status,
        messageIds,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error("Failed to send email via Mailjet", {
        subject: input.subject,
        reason,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, `Mailjet send failed: ${reason}`);
    }
  }
}
