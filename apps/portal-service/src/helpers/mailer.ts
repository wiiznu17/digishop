import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_NAME = process.env.MAIL_FROM_NAME || "wissanu";
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || "wissanuray@gmail.com";
const ADMIN_PORTAL_URL = process.env.ADMIN_PORTAL_URL || "http://localhost:3002";

if (!SENDGRID_API_KEY) {
  throw new Error("[mailer] Missing SENDGRID_API_KEY");
}
sgMail.setApiKey(SENDGRID_API_KEY);

async function sendMail(to: string, subject: string, text: string, html?: string) {
  await sgMail.send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    text,
    html,
  });
}

// ส่งอีเมลเชิญ (Invite) ให้ตั้งรหัสผ่านครั้งแรก
export async function sendAdminInvite(email: string, name: string = "", rawToken: string) {
  const link = `${ADMIN_PORTAL_URL}/set-password?token=${encodeURIComponent(rawToken)}`;
  console.log("send email to : ", link)
  const { subject, text, html } = inviteTemplate(name, link);
  await sendMail(email, subject, text, html);
}


// ส่งอีเมลรีเซ็ตรหัสผ่าน (Reset)
export async function sendAdminReset(email: string, name: string = "", rawToken: string) {
  const link = `${ADMIN_PORTAL_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const { subject, text, html } = resetTemplate(name, link);
  await sendMail(email, subject, text, html);
}

function inviteTemplate(name: string, link: string) {
  const safeName = name?.trim() || "there";
  const subject = "You're invited to Digishop Admin";
  const text = `Hello ${safeName},

You've been invited to the Digishop Admin. Set your password here:
${link}

If you did not expect this, you can ignore this email.`;

  const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color:#111; line-height:1.6">
    <h2 style="margin:0 0 12px">You're invited to Digishop Admin</h2>
    <p>Hello ${escapeHtml(safeName)},</p>
    <p>You've been invited to the Digishop Admin. Click the button below to set your password.</p>
    <p>
      <a href="${link}" style="background:#111827;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block">
        Set your password
      </a>
    </p>
    <p>Or copy this link:</p>
    <p><code>${escapeHtml(link)}</code></p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
    <small>If you did not expect this, you can ignore this email.</small>
  </body>
</html>`;

  return { subject, text, html };
}

function resetTemplate(name: string, link: string) {
  const safeName = name?.trim() || "there";
  const subject = "Reset your Digishop Admin password";
  const text = `Hello ${safeName},

We received a request to reset your password. Reset it here:
${link}

If you didn't request this, you can ignore this email.`;

  const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color:#111; line-height:1.6">
    <h2 style="margin:0 0 12px">Reset your password</h2>
    <p>Hello ${escapeHtml(safeName)},</p>
    <p>We received a request to reset your password. Click below to proceed.</p>
    <p>
      <a href="${link}" style="background:#111827;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block">
        Reset password
      </a>
    </p>
    <p>Or copy this link:</p>
    <p><code>${escapeHtml(link)}</code></p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
    <small>If you didn't request this, you can ignore this email.</small>
  </body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

