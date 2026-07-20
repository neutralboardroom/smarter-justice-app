const { EMAIL_TEMPLATES } = require('../data/emailTemplates');

function configured(){ return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS); }
function buildMessage(kind, note){
  const payload = note.payload || {};
  const template = EMAIL_TEMPLATES[kind] || { subject: `Smarter Justice update: ${kind}` };
  const lines = [
    'Smarter Justice update',
    '',
    template.purpose || 'A saved file or support request was updated.',
    ''
  ];
  if (payload.caseId) lines.push(`File ID: ${payload.caseId}`);
  if (payload.practice) lines.push(`Practice area: ${payload.practice}`);
  if (payload.message) lines.push(`Message: ${payload.message}`);
  if (payload.continuationLink) lines.push(`Private continuation link: ${payload.continuationLink}`);
  if (payload.checkoutUrl) lines.push(`Payment link: ${payload.checkoutUrl}`);
  lines.push('', 'Smarter Justice is a private support service, not a law firm and not the government. No outcome is guaranteed.');
  return { subject: template.subject || `Smarter Justice update: ${kind}`, text: lines.filter(x => x !== undefined).join('\n') };
}
async function sendNotification(note){
  if (!configured()) return { sent:false, reason:'smtp-not-configured' };
  let nodemailer;
  try { nodemailer = require('nodemailer'); } catch { return { sent:false, reason:'nodemailer-not-installed' }; }
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  const msg = buildMessage(note.kind, note);
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: note.to,
    subject: msg.subject,
    text: msg.text
  });
  return { sent:true };
}
module.exports = { configured, buildMessage, sendNotification };
