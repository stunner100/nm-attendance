type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getEmailFromAddress(): string | null {
  return (
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    null
  );
}

export function isEmailConfigured(): boolean {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return false;
  }

  return Boolean(getEmailFromAddress());
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getEmailFromAddress();

  if (!apiKey || !from) {
    throw new Error("Email is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email request failed (${response.status}): ${body}`);
  }
}
