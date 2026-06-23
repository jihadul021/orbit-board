const RESEND_API_URL = 'https://api.resend.com/emails'
const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev'

const getResendConfig = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing Resend API key. Ensure RESEND_API_KEY is set.')
  }

  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL
  }
}

export const sendOtpEmail = async ({ to, otp, purpose }) => {
  const isReset = purpose === 'reset_password'
  const subject = isReset ? 'Reset your OrbitBoard password' : 'Verify your OrbitBoard account'
  const eyebrow = isReset ? 'Password recovery' : 'Account verification'
  const title = isReset ? 'Reset your password' : 'Verify your email address'
  const message = isReset
    ? 'We received a request to reset your OrbitBoard password. Enter this code to continue.'
    : 'Welcome to OrbitBoard. Enter this code to verify your email and finish creating your account.'
  const supportMessage = isReset
    ? 'If you did not request a password reset, you can safely ignore this email. Your password will not change.'
    : 'If you did not try to create an OrbitBoard account, you can safely ignore this email.'
  const preheader = `${otp} is your OrbitBoard verification code. It expires in 10 minutes.`

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${subject}</title>
      </head>
      <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
          ${preheader}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
                <tr>
                  <td style="padding:28px 32px 20px;border-bottom:1px solid #eef2f7;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="width:40px;height:40px;border-radius:12px;background:#4f46e5;color:#ffffff;font-size:20px;font-weight:700;text-align:center;vertical-align:middle;">O</td>
                              <td style="padding-left:12px;">
                                <div style="font-size:18px;font-weight:700;color:#0f172a;">OrbitBoard</div>
                                <div style="font-size:12px;color:#64748b;margin-top:2px;">Editorial workflow workspace</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td align="right" style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6366f1;">
                          ${eyebrow}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#0f172a;">${title}</h1>
                    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569;">
                      ${message}
                    </p>
                    <div style="background:#f1f5ff;border:1px solid #dfe7ff;border-radius:16px;padding:24px;text-align:center;margin:0 0 24px;">
                      <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">Your verification code</div>
                      <div style="font-size:34px;line-height:1;font-weight:800;letter-spacing:0.26em;color:#312e81;margin-left:0.26em;">${otp}</div>
                      <div style="font-size:13px;color:#64748b;margin-top:14px;">Expires in 10 minutes</div>
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin:0 0 24px;">
                      <tr>
                        <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#92400e;">
                          For your security, never share this code with anyone. OrbitBoard will never ask for your OTP outside the app.
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                      ${supportMessage}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #eef2f7;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                      Sent by OrbitBoard. This is an automated message, so replies to this email are not monitored.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  try {
    const { apiKey, from } = getResendConfig()
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `OrbitBoard <${from}>`,
        to,
        subject,
        text: `${title}\n\n${message}\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\n${supportMessage}`,
        html
      })
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || data.error || `Resend API request failed with status ${response.status}`)
    }

    console.log(`Resend OTP email sent successfully to ${to}`)
    return data
  } catch (err) {
    console.error('OTP email error:', {
      message: err.message
    })

    throw new Error(`Could not send OTP email with Resend. ${err.message}`)
  }
}
