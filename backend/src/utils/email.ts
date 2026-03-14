import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'Alojafy <noreply@alojafy.com>';

const isConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    console.log('--- EMAIL (SMTP no configurado, mostrando en consola) ---');
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log('-----------------------------------------------------------');
    return;
  }
  await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Alojafy</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#4f46e5;padding:28px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 10px;vertical-align:middle;">
                    <span style="font-size:18px;">🏠</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Alojafy</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Si no esperabas este email, podés ignorarlo.<br/>
                &copy; ${new Date().getFullYear()} Alojafy. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendActivationEmail(
  to: string,
  name: string,
  activationLink: string,
  orgName: string
): Promise<void> {
  const subject = `Te invitaron a unirte a ${orgName}`;
  const firstName = name.split(' ')[0];
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Hola, ${firstName} 👋</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      Te invitaron a unirte a <strong style="color:#111827;">${orgName}</strong> en Alojafy.<br/>
      Hacé clic en el botón de abajo para crear tu contraseña y activar tu cuenta.
    </p>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#6b7280;">
        ⏱ Este enlace expira en <strong>24 horas</strong>.
      </p>
    </div>

    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <a href="${activationLink}"
             style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.1px;">
            Activar mi cuenta →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all;">
      O copiá este enlace en tu navegador:<br/>
      <a href="${activationLink}" style="color:#6366f1;">${activationLink}</a>
    </p>
  `;
  await sendEmail(to, subject, baseTemplate(content));
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetLink: string
): Promise<void> {
  const subject = 'Restablecer contraseña — Alojafy';
  const firstName = name.split(' ')[0];
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Restablecer contraseña</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hola, <strong>${firstName}</strong>. Recibimos una solicitud para restablecer la contraseña de tu cuenta en Alojafy.
    </p>

    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        ⏱ Este enlace expira en <strong>1 hora</strong>. Si no lo usás, tu contraseña no cambiará.
      </p>
    </div>

    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <a href="${resetLink}"
             style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.1px;">
            Crear nueva contraseña →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">
      Si no solicitaste esto, podés ignorar este email. Tu contraseña no será modificada.
    </p>
    <p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all;">
      O copiá este enlace en tu navegador:<br/>
      <a href="${resetLink}" style="color:#6366f1;">${resetLink}</a>
    </p>
  `;
  await sendEmail(to, subject, baseTemplate(content));
}
