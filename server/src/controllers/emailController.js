const { PrismaClient } = require('@prisma/client');
const { badRequest, success } = require('../utils/apiResponse');
const { sendEmail } = require('../services/emailService');

const prisma = new PrismaClient();

const sendTestEmail = async (req, res, next) => {
  try {
    const { to } = req.body;
    if (!to) {
      return badRequest(res, 'Recipient email address is required');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const smtpOverride = {
      host: user?.smtpHost,
      port: user?.smtpPort,
      user: user?.smtpUser,
      pass: user?.smtpPass,
      from: user?.smtpFrom,
    };

    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;background:#f8fafc;padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
          <h1 style="margin:0 0 12px;color:#0f172a;">Credit Mint SMTP Test</h1>
          <p style="margin:0 0 12px;color:#475569;line-height:1.6;">
            This confirms that your Credit Mint SMTP configuration is working correctly.
          </p>
          <p style="margin:0;color:#64748b;line-height:1.6;">
            Sent at ${new Date().toLocaleString('en-IN')}.
          </p>
        </div>
      </div>
    `;

    const result = await sendEmail(
      to,
      'Credit Mint SMTP Test Email',
      html,
      'This confirms that your Credit Mint SMTP configuration is working correctly.',
      smtpOverride
    );

    if (!result.sent) {
      return badRequest(res, result.error || result.reason || 'Unable to send test email');
    }

    return success(res, { messageId: result.messageId }, 'Test email sent successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { sendTestEmail };
