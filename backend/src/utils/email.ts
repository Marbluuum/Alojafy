import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@alojafy.com';

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
    console.log('--- EMAIL (SMTP not configured, logging to console) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log('-------------------------------------------------------');
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<void> {
  const subject = 'Restablecer contraseña — Alojafy';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">Hola, ${name}</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña en <strong>Alojafy</strong>.</p>
      <p>Hacé clic en el botón de abajo para crear una nueva contraseña. Este enlace expira en 1 hora.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}"
           style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Restablecer contraseña
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Si no solicitaste esto, podés ignorar este email.</p>
      <p style="color: #6b7280; font-size: 14px;">O copiá este enlace en tu navegador:<br/><a href="${resetLink}">${resetLink}</a></p>
    </div>
  `;
  await sendEmail(to, subject, html);
}

export async function sendActivationEmail(to: string, name: string, activationLink: string, orgName: string): Promise<void> {
  const subject = `Activá tu cuenta en ${orgName} — Alojafy`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">Hola, ${name}</h2>
      <p>Te invitaron a unirte a <strong>${orgName}</strong> en <strong>Alojafy</strong>.</p>
      <p>Hacé clic en el botón de abajo para activar tu cuenta y configurar tu contraseña. Este enlace expira en 72 horas.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${activationLink}"
           style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Activar mi cuenta
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">O copiá este enlace en tu navegador:<br/><a href="${activationLink}">${activationLink}</a></p>
    </div>
  `;
  await sendEmail(to, subject, html);
}

export async function sendWelcomeEmail(to: string, name: string, orgName: string): Promise<void> {
  const subject = `Bienvenido a ${orgName} — Alojafy`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e;">Bienvenido, ${name}!</h2>
      <p>Tu cuenta en <strong>${orgName}</strong> fue creada exitosamente en <strong>Alojafy</strong>.</p>
      <p>Ya podés ingresar con tu email y contraseña.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
           style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Ir al panel
        </a>
      </div>
    </div>
  `;
  await sendEmail(to, subject, html);
}
