import nodemailer from 'nodemailer';

const APP_NAME = 'FrameVault';

function createTransport() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,   // your Gmail address
            pass: process.env.GMAIL_APP_PASSWORD, // 16-char App Password
        },
    });
}

export async function sendPasswordResetEmail(
    to: string,
    resetUrl: string,
): Promise<void> {
    const transporter = createTransport();
    await transporter.sendMail({
        from: `${APP_NAME} <${process.env.GMAIL_USER}>`,
        to,
        subject: `Your ${APP_NAME} password reset link`,
        replyTo: process.env.GMAIL_USER,
        text: `
Hi,

You requested a password reset for your ${APP_NAME} account.

Click the link below to set a new password (expires in 1 hour):

${resetUrl}

If you didn't request this, you can safely ignore this email.

— The ${APP_NAME} Team
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',system-ui,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1a1a2e;border-radius:12px;border:1px solid rgba(99,102,241,0.2);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">🎬 ${APP_NAME}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#f1f5f9;">Reset your password</h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">
                We received a request to reset the password for your ${APP_NAME} account.
                Click the button below to set a new password. This link expires in <strong style="color:#e2e8f0;">1 hour</strong>.
              </p>
              <a href="${resetUrl}"
                 style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">
                Reset Password
              </a>
              <p style="margin:32px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
                If you didn't request this, you can safely ignore this email — your password won't change.
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
                If the button above doesn't work, paste this link into your browser:<br>
                <a href="${resetUrl}" style="color:#6366f1;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim(),
    });
}
