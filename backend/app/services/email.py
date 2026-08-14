import httpx
from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def send_password_reset_email(to_email: str, full_name: str, otp: str) -> bool:
    """
    Send a password-reset OTP email via Resend.
    Returns True on success, False if RESEND_API_KEY is not configured (dev mode).
    """
    settings = get_settings()

    if not settings.resend_api_key:
        logger.warning(f"RESEND_API_KEY not set — OTP for {to_email}: {otp}")
        return False

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

            <!-- Header -->
            <tr>
              <td style="background:#2D6A4F;padding:32px;text-align:center;">
                <div style="font-size:40px;margin-bottom:8px;">🌱</div>
                <div style="color:#fff;font-size:22px;font-weight:800;">CropVana</div>
                <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Password Reset</div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 40px;">
                <p style="font-size:16px;color:#374151;margin:0 0 8px;">Hi {full_name},</p>
                <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 28px;">
                  We received a request to reset your CropVana password.
                  Use the code below in the app. It expires in <strong>15 minutes</strong>.
                </p>

                <!-- OTP box -->
                <div style="background:#f0fdf4;border:2px solid #2D6A4F;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                  <div style="font-size:11px;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Your reset code</div>
                  <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#2D6A4F;">{otp}</div>
                </div>

                <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                  If you did not request a password reset, you can safely ignore this email.
                  Your password will not be changed.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="font-size:12px;color:#9ca3af;margin:0;">
                  &copy; 2026 CropVana · AgriVision &nbsp;|&nbsp;
                  <a href="https://moussassoss.github.io/agrivision/privacy-policy.html"
                     style="color:#2D6A4F;text-decoration:none;">Privacy Policy</a>
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    payload = {
        "from":    settings.email_from,
        "to":      [to_email],
        "subject": "Your CropVana password reset code",
        "html":    html_body,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type":  "application/json",
                },
                json=payload,
                timeout=10.0,
            )
            resp.raise_for_status()
            logger.info(f"Password reset email sent to {to_email}")
            return True
    except Exception as exc:
        logger.error(f"Failed to send reset email to {to_email}: {exc}")
        raise
