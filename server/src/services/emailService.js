const nodemailer = require('nodemailer');

const DEFAULT_FROM = 'Credit Mint <noreply@creditmint.app>';

const formatCurrency = (amount) => {
  const value = Number(amount || 0);
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const resolveSmtpConfig = (smtpOverride = {}) => ({
  host: smtpOverride.host || process.env.SMTP_HOST,
  port: Number(smtpOverride.port || process.env.SMTP_PORT || 587),
  user: smtpOverride.user || process.env.SMTP_USER,
  pass: smtpOverride.pass || process.env.SMTP_PASS,
  from: smtpOverride.from || process.env.SMTP_FROM || DEFAULT_FROM,
});

const isSmtpConfigured = (config) => Boolean(config.host && config.port && config.user && config.pass);

const createTransporter = (smtpOverride = {}) => {
  const config = resolveSmtpConfig(smtpOverride);
  if (!isSmtpConfigured(config)) {
    return { transporter: null, config };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return { transporter, config };
};

const verifyEmailConnection = async (smtpOverride = {}) => {
  const { transporter, config } = createTransporter(smtpOverride);
  if (!transporter) {
    return { ok: false, skipped: true, reason: 'SMTP not configured' };
  }

  try {
    await transporter.verify();
    return { ok: true, skipped: false, config };
  } catch (error) {
    console.error('[Email] SMTP verification failed:', error.message);
    return { ok: false, skipped: false, reason: error.message, config };
  }
};

const buildEmailLayout = ({
  eyebrow,
  title,
  intro,
  amountLabel,
  amountValue,
  rows = [],
  bodyNote,
  accent = '#059669',
}) => {
  const rowHtml = rows
    .map(
      ({ key, value }) => `
        <div class="info-row">
          <span class="key">${escapeHtml(key)}</span>
          <span class="val">${escapeHtml(value)}</span>
        </div>
      `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 24px; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08); }
    .header { background: ${accent}; padding: 28px 32px; color: #ffffff; }
    .brand { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.92; }
    .title { font-size: 28px; line-height: 1.15; font-weight: 800; margin: 10px 0 6px; }
    .eyebrow { font-size: 14px; opacity: 0.9; margin: 0; }
    .body { padding: 28px 32px 24px; word-break: break-word; }
    .body p { margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: #334155; }
    .amount-card { margin: 22px 0; padding: 18px 20px; border-radius: 14px; background: #f8fafc; border: 1px solid #dbeafe; }
    .amount-card .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
    .amount-card .value { margin-top: 6px; font-size: 30px; line-height: 1.1; font-weight: 800; color: #0f172a; }
    .info-row { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid #eef2f7; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .key { color: #64748b; flex: 0 0 auto; }
    .val { color: #0f172a; font-weight: 700; text-align: right; flex: 1; word-wrap: break-word; }
    .footer { padding: 18px 32px 28px; color: #94a3b8; font-size: 12px; text-align: center; }
    @media (max-width: 600px) {
      body { padding: 16px; }
      .container { border-radius: 12px; }
      .header { padding: 20px 16px; border-radius: 12px 12px 0 0; }
      .brand { font-size: 11px; }
      .title { font-size: 22px; margin: 8px 0 4px; }
      .eyebrow { font-size: 13px; }
      .body { padding: 20px 16px; }
      .body p { font-size: 14px; margin: 0 0 12px; }
      .amount-card { margin: 16px 0; padding: 16px; }
      .amount-card .label { font-size: 11px; }
      .amount-card .value { font-size: 24px; margin-top: 4px; }
      .info-row { display: block; padding: 10px 0; gap: 0; }
      .info-row:last-child { border-bottom: none; }
      .key { display: block; color: #64748b; font-size: 12px; margin-bottom: 4px; }
      .val { display: block; margin-top: 0; text-align: left; font-size: 13px; word-break: break-word; }
      .footer { padding: 12px 16px 16px; font-size: 11px; }
    }
    @media (max-width: 360px) {
      body { padding: 12px; }
      .header { padding: 16px 12px; }
      .body { padding: 16px 12px; }
      .title { font-size: 18px; }
      .amount-card { padding: 12px; }
      .amount-card .value { font-size: 20px; }
      .info-row { padding: 8px 0; }
      .key { font-size: 11px; }
      .val { font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Credit Mint</div>
      <div class="title">${escapeHtml(title)}</div>
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
    </div>
    <div class="body">
      <p>${intro}</p>
      <div class="amount-card">
        <div class="label">${escapeHtml(amountLabel)}</div>
        <div class="value">${escapeHtml(amountValue)}</div>
      </div>
      ${rowHtml}
      <p>${bodyNote}</p>
    </div>
    <div class="footer">
      Sent from Credit Mint. Please contact your lender directly if you have any questions.
    </div>
  </div>
</body>
</html>
  `;
};

const reminderTemplateBuilders = {
  DUE_TOMORROW: ({ borrowerName, lenderName, amount, dueDate, loanType, daysUntilDue = 1 }) => {
    const isTomorrowReminder = daysUntilDue === 1;
    const dueLabel = isTomorrowReminder ? 'tomorrow' : `in ${daysUntilDue} days`;

    return {
      subject: `Payment reminder: ${formatCurrency(amount)} due ${dueLabel}`,
      text: `Hello ${borrowerName}, ${formatCurrency(amount)} is due ${dueLabel} (${formatDate(dueDate)}) for your ${loanType.toLowerCase()} loan from ${lenderName}. Please arrange payment on time.`,
      html: buildEmailLayout({
        eyebrow: 'Upcoming payment reminder',
        title: `Hello ${borrowerName}, your loan is due ${dueLabel}`,
        intro: `This is a reminder from <strong>${escapeHtml(lenderName)}</strong> that your payment is scheduled ${isTomorrowReminder ? 'for tomorrow' : `in ${daysUntilDue} days`}.`,
        amountLabel: 'Amount due',
        amountValue: formatCurrency(amount),
        rows: [
          { key: 'Due date', value: formatDate(dueDate) },
          { key: 'Interest type', value: loanType },
          { key: 'Lender', value: lenderName },
        ],
        bodyNote: 'Please keep your payment ready so the loan stays current.',
        accent: '#2563eb',
      }),
    };
  },
  DUE_TODAY: ({ borrowerName, lenderName, amount, dueDate, loanType }) => ({
    subject: `Payment due today: ${formatCurrency(amount)}`,
    text: `Hello ${borrowerName}, ${formatCurrency(amount)} is due today (${formatDate(dueDate)}) for your ${loanType.toLowerCase()} loan from ${lenderName}.`,
    html: buildEmailLayout({
      eyebrow: 'Payment due today',
      title: `Payment due today`,
      intro: `Dear <strong>${escapeHtml(borrowerName)}</strong>, your payment to <strong>${escapeHtml(lenderName)}</strong> is due today.`,
      amountLabel: 'Pay today',
      amountValue: formatCurrency(amount),
      rows: [
        { key: 'Due date', value: formatDate(dueDate) },
        { key: 'Interest type', value: loanType },
        { key: 'Lender', value: lenderName },
      ],
      bodyNote: 'Please complete the payment today to avoid late charges.',
      accent: '#d97706',
    }),
  }),
  OVERDUE: ({ borrowerName, lenderName, amount, dueDate, loanType, overdueDays }) => ({
    subject: `Overdue payment notice: ${formatCurrency(amount)}`,
    text: `Hello ${borrowerName}, your payment of ${formatCurrency(amount)} for the ${loanType.toLowerCase()} loan from ${lenderName} is overdue by ${overdueDays} day(s). Original due date: ${formatDate(dueDate)}.`,
    html: buildEmailLayout({
      eyebrow: 'Overdue loan notice',
      title: `Your payment is overdue`,
      intro: `Dear <strong>${escapeHtml(borrowerName)}</strong>, your loan payment to <strong>${escapeHtml(lenderName)}</strong> is now overdue.`,
      amountLabel: 'Current outstanding amount',
      amountValue: formatCurrency(amount),
      rows: [
        { key: 'Original due date', value: formatDate(dueDate) },
        { key: 'Overdue by', value: `${overdueDays} day(s)` },
        { key: 'Interest type', value: loanType },
      ],
      bodyNote: 'Please arrange payment as soon as possible to prevent additional charges.',
      accent: '#dc2626',
    }),
  }),
  PAYMENT_RECEIVED: ({ borrowerName, lenderName, amount, paidAt, note }) => ({
    subject: `Payment received: ${formatCurrency(amount)}`,
    text: `Hello ${borrowerName}, ${lenderName} has recorded your payment of ${formatCurrency(amount)} on ${formatDate(paidAt)}.${note ? ` Note: ${note}` : ''}`,
    html: buildEmailLayout({
      eyebrow: 'Payment confirmation',
      title: `Payment received successfully`,
      intro: `Dear <strong>${escapeHtml(borrowerName)}</strong>, <strong>${escapeHtml(lenderName)}</strong> has recorded your payment.`,
      amountLabel: 'Amount received',
      amountValue: formatCurrency(amount),
      rows: [
        { key: 'Received on', value: formatDate(paidAt) },
        { key: 'Lender', value: lenderName },
        { key: 'Reference note', value: note || 'Not provided' },
      ],
      bodyNote: 'Thank you. This confirmation was sent for your records.',
      accent: '#059669',
    }),
  }),
  LOAN_CREATED: ({ borrowerName, lenderName, totalAmount, dueDate, loanId, lenderContact }) => ({
    subject: `Loan created: ${formatCurrency(totalAmount)} due on ${formatDate(dueDate)}`,
    text: `Hello ${borrowerName}, a new loan has been created for you. Amount due: ${formatCurrency(totalAmount)}. Due date: ${formatDate(dueDate)}. Loan reference: ${loanId}. Contact: ${lenderContact}`,
    html: buildEmailLayout({
      eyebrow: 'Loan confirmation',
      title: `Your loan has been created`,
      intro: `Dear <strong>${escapeHtml(borrowerName)}</strong>, your new loan has been created. Please review the details below.`,
      amountLabel: 'Amount to pay',
      amountValue: formatCurrency(totalAmount),
      rows: [
        { key: 'Due date', value: formatDate(dueDate) },
        { key: 'Loan reference', value: loanId },
        { key: 'Lender contact', value: lenderContact },
      ],
      bodyNote: 'Please keep this confirmation for your records.',
      accent: '#0891b2',
    }),
  }),
  INTEREST_COLLECTED: ({ borrowerName, lenderName, amount, nextDueDate, totalAmount }) => ({
    subject: `Interest Collected: ${formatCurrency(amount)}`,
    text: `Hello ${borrowerName}, as per your request this month's interest (${formatCurrency(amount)}) has been collected. Your new due date is ${formatDate(nextDueDate)} and the total amount due for the next cycle is ${formatCurrency(totalAmount)}.`,
    html: buildEmailLayout({
      eyebrow: 'Interest Collection Confirmation',
      title: `Interest collected successfully`,
      intro: `Dear <strong>${escapeHtml(borrowerName)}</strong>, as per your request, this month's interest has been collected by <strong>${escapeHtml(lenderName)}</strong>.`,
      amountLabel: 'Interest amount received',
      amountValue: formatCurrency(amount),
      rows: [
        { key: 'New due date', value: formatDate(nextDueDate) },
        { key: 'Updated total amount', value: formatCurrency(totalAmount) },
        { key: 'Lender', value: lenderName },
      ],
      bodyNote: `Your loan has been successfully extended. The next payment is due on ${formatDate(nextDueDate)}.`,
      accent: '#059669',
    }),
  }),
};

const buildReminderEmail = (templateType, payload) => {
  const builder = reminderTemplateBuilders[templateType];
  if (!builder) {
    throw new Error(`Unsupported email template: ${templateType}`);
  }
  return builder(payload);
};

const sendEmail = async (to, subject, html, text = '', smtpOverride = {}) => {
  const { transporter, config } = createTransporter(smtpOverride);
  if (!transporter) {
    return { sent: false, skipped: true, reason: 'SMTP not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
      text,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send email to ${to}:`, error.message);
    return { sent: false, error: error.message };
  }
};

const sendTemplateEmail = async (templateType, payload, smtpOverride = {}) => {
  const template = buildReminderEmail(templateType, payload);
  return sendEmail(payload.to, template.subject, template.html, template.text, smtpOverride);
};

const sendReminderEmail = async ({
  templateType,
  to,
  borrowerName,
  lenderName,
  amount,
  dueDate,
  loanType,
  daysUntilDue,
  overdueDays = 0,
  smtpOverride = {},
}) =>
  sendTemplateEmail(
    templateType,
    { to, borrowerName, lenderName, amount, dueDate, loanType, daysUntilDue, overdueDays },
    smtpOverride
  );

const sendPaymentReceivedEmail = async ({
  to,
  borrowerName,
  lenderName,
  amount,
  paidAt = new Date(),
  note = '',
  smtpOverride = {},
}) =>
  sendTemplateEmail(
    'PAYMENT_RECEIVED',
    { to, borrowerName, lenderName, amount, paidAt, note },
    smtpOverride
  );

const sendLoanCreatedEmail = async ({
  to,
  borrowerName,
  lenderName,
  totalAmount,
  dueDate,
  loanId,
  lenderContact,
  smtpOverride = {},
}) =>
  sendTemplateEmail(
    'LOAN_CREATED',
    { to, borrowerName, lenderName, totalAmount, dueDate, loanId, lenderContact },
    smtpOverride
  );

const sendInterestCollectedEmail = async ({
  to,
  borrowerName,
  lenderName,
  amount,
  nextDueDate,
  totalAmount,
  smtpOverride = {},
}) =>
  sendTemplateEmail(
    'INTEREST_COLLECTED',
    { to, borrowerName, lenderName, amount, nextDueDate, totalAmount },
    smtpOverride
  );

module.exports = {
  buildReminderEmail,
  createTransporter,
  resolveSmtpConfig,
  sendEmail,
  sendPaymentReceivedEmail,
  sendLoanCreatedEmail,
  sendInterestCollectedEmail,
  sendReminderEmail,
  verifyEmailConnection,
};
