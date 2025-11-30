"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplates = void 0;
exports.EmailTemplates = {
    welcome: {
        Subject: "Welcome to {gymName}!",
        Html: "<h1>Hello {name}</h1><p>Your gym {gymName} has been onboarded successfully.</p>",
        Text: "Hello {name}, your gym {gymName} has been onboarded successfully.",
    },
    paymentReminder: {
        Subject: "Payment Reminder for {gymName}",
        Html: "<p>Hi {name},</p><p>Your gym {gymName} has a pending payment of ₹{amount} due by {dueDate}.</p>",
        Text: "Hi {name}, your gym {gymName} has a pending payment of ₹{amount} due by {dueDate}.",
    },
};
