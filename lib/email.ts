import { Resend } from "resend";

// Lazy-initialized so build doesn't fail when RESEND_API_KEY is not yet set
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured.");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "noreply@yourdomain.com";
const APP_NAME = "Malaysia ERP";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:#2563eb;color:#fff;font-size:18px;font-weight:700;letter-spacing:2px;padding:8px 16px;border-radius:8px;">ERP</div>
              <div style="color:#94a3b8;font-size:13px;margin-top:8px;">${APP_NAME}</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#0f172a;font-size:22px;font-weight:700;">Reset your password</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                We received a request to reset your password. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                  Reset Password
                </a>
              </div>
              <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">Or copy this link into your browser:</p>
              <p style="margin:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;font-size:12px;color:#475569;word-break:break-all;">
                ${resetUrl}
              </p>
              <p style="margin:32px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not change.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;color:#cbd5e1;font-size:12px;">${APP_NAME} · Multi-Channel Commerce ERP</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

// ─── User Invite ──────────────────────────────────────────────────────────────

export async function sendUserInviteEmail(
  email: string,
  name: string,
  tempPassword: string,
  orgName: string,
  invitedByName: string
) {
  const loginUrl = `${APP_URL}/login`;

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `You've been invited to ${orgName} on ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:#2563eb;color:#fff;font-size:18px;font-weight:700;letter-spacing:2px;padding:8px 16px;border-radius:8px;">ERP</div>
              <div style="color:#94a3b8;font-size:13px;margin-top:8px;">${APP_NAME}</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#0f172a;font-size:22px;font-weight:700;">Welcome, ${name}! 👋</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                <strong>${invitedByName}</strong> has invited you to join <strong>${orgName}</strong> on ${APP_NAME}.
              </p>
              <!-- Credentials box -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 12px;color:#475569;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your Login Credentials</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:14px;width:80px;">Email</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:14px;">Password</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;font-family:monospace;">${tempPassword}</td>
                  </tr>
                </table>
              </div>
              <p style="margin:0 0 24px;color:#f59e0b;font-size:13px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;">
                ⚠️ Please change your password after your first login.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${loginUrl}"
                   style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                  Sign In to ${APP_NAME}
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;color:#cbd5e1;font-size:12px;">${APP_NAME} · Multi-Channel Commerce ERP</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}
