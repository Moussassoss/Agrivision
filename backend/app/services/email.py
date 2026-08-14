import httpx
from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def _send(to_email: str, subject: str, html_body: str) -> bool:
    """Core Resend API call. Returns True on success, False if key not configured."""
    settings = get_settings()
    if not settings.resend_api_key:
        logger.warning(f"RESEND_API_KEY not set — skipping email to {to_email} | Subject: {subject}")
        return False

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type":  "application/json",
                },
                json={"from": settings.email_from, "to": [to_email], "subject": subject, "html": html_body},
                timeout=10.0,
            )
            resp.raise_for_status()
            logger.info(f"Email sent to {to_email} | Subject: {subject}")
            return True
    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        raise


async def send_welcome_email(to_email: str, full_name: str) -> bool:
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

            <tr>
              <td style="background:#2D6A4F;padding:32px;text-align:center;">
                <div style="font-size:40px;margin-bottom:8px;">🌱</div>
                <div style="color:#fff;font-size:22px;font-weight:800;">Welcome to CropVana</div>
                <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Smart farming starts here</div>
              </td>
            </tr>

            <tr>
              <td style="padding:36px 40px;">
                <p style="font-size:16px;color:#374151;margin:0 0 16px;">Hi {full_name} 👋</p>
                <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px;">
                  Your CropVana account has been created successfully. You can now open the app
                  and get AI-powered crop recommendations tailored to your exact field location in Rwanda.
                </p>

                <div style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                  <div style="font-size:13px;font-weight:700;color:#2D6A4F;margin-bottom:12px;">What you can do with CropVana:</div>
                  <div style="font-size:13px;color:#374151;line-height:1.9;">
                    🛰️ &nbsp;Get soil data from satellite at 30m resolution<br/>
                    🌦️ &nbsp;Real-time weather &amp; rainfall analysis<br/>
                    🤖 &nbsp;AI crop recommendations with 98% accuracy<br/>
                    🌾 &nbsp;Step-by-step planting guides for 21 crops<br/>
                    📋 &nbsp;Fertilizer advice tailored to each crop
                  </div>
                </div>

                <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                  If you did not create this account, please ignore this email or contact us at
                  <a href="mailto:ssossinfo88@gmail.com" style="color:#2D6A4F;">ssossinfo88@gmail.com</a>.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="font-size:12px;color:#9ca3af;margin:0;">
                  &copy; 2026 CropVana · AgriVision &nbsp;|&nbsp;
                  <a href="https://moussassoss.github.io/agrivision/privacy-policy.html" style="color:#2D6A4F;text-decoration:none;">Privacy Policy</a>
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """
    return await _send(to_email, "Welcome to CropVana 🌱", html_body)


async def send_password_reset_email(to_email: str, full_name: str, otp: str) -> bool:
    """Send a 6-digit OTP reset code. Logs the OTP to console if RESEND_API_KEY not set."""
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
            <tr>
              <td style="background:#2D6A4F;padding:32px;text-align:center;">
                <div style="font-size:40px;margin-bottom:8px;">🌱</div>
                <div style="color:#fff;font-size:22px;font-weight:800;">CropVana</div>
                <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Password Reset</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px;">
                <p style="font-size:16px;color:#374151;margin:0 0 8px;">Hi {full_name},</p>
                <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 28px;">
                  We received a request to reset your CropVana password.
                  Enter the code below in the app. It expires in <strong>15 minutes</strong>.
                </p>
                <div style="background:#f0fdf4;border:2px solid #2D6A4F;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                  <div style="font-size:11px;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Your reset code</div>
                  <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#2D6A4F;">{otp}</div>
                </div>
                <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                  If you did not request a password reset, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="font-size:12px;color:#9ca3af;margin:0;">
                  &copy; 2026 CropVana · AgriVision &nbsp;|&nbsp;
                  <a href="https://moussassoss.github.io/agrivision/privacy-policy.html" style="color:#2D6A4F;text-decoration:none;">Privacy Policy</a>
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """
    return await _send(to_email, "Your CropVana password reset code", html_body)
