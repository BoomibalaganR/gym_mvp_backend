export interface EmailPayload {
  to: string;
  templateName: keyof typeof import("../templates/email.template").EmailTemplates;
  context: Record<string, any>;
}

export interface SmsPayload {
  to: string;
  templateName: keyof typeof import("../templates/sms.template").SmsTemplates;
  context: Record<string, any>;
}

export interface WhatsappPayload {
  to: string;
  templateName: keyof typeof import("../templates/whatsapp.template").WhatsappTemplates;
  context: Record<string, any>;
}

export interface NotificationPayload {
  email?: { payload: EmailPayload };
  sms?: { payload: SmsPayload };
  whatsapp?: { payload: WhatsappPayload };
}
