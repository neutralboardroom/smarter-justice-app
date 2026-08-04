const { EMAIL_TEMPLATES } = require('../data/emailTemplates');

function status(){
  const hostConfigured=Boolean(process.env.SMTP_HOST);
  const credentialsConfigured=Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  const senderConfigured=Boolean(process.env.SMTP_FROM);
  return { hostConfigured, credentialsConfigured, senderConfigured, configured:hostConfigured && credentialsConfigured && senderConfigured };
}
function configured(){ return status().configured; }
function buildMessage(kind, note){
  const payload = note.safePayload || note.payload || {};
  const template = EMAIL_TEMPLATES[kind] || { subject: `Smarter Justice update: ${kind}`, templateVersion:'1.0.0', classification:'OWNER_STAFF_INTERNAL' };
  const lines = [
    'Smarter Justice update',
    '',
    template.purpose || 'A saved file or support request was updated.',
    ''
  ];
  if (payload.caseId) lines.push(`File ID: ${payload.caseId}`);
  if (payload.practice) lines.push(`Practice area: ${payload.practice}`);
  if (payload.message) lines.push(`Message: ${payload.message}`);
  if (payload.actionLink) lines.push(`${payload.actionLabel || 'Secure link'}: ${payload.actionLink}`);
  if (payload.continuationLink) lines.push(`Private continuation link: ${payload.continuationLink}`);
  if (payload.checkoutUrl) lines.push(`Payment link: ${payload.checkoutUrl}`);
  lines.push('', 'Smarter Justice is a private support service, not a law firm and not the government. No outcome is guaranteed.');
  return { subject: template.subject || `Smarter Justice update: ${kind}`, text: lines.filter(x => x !== undefined).join('\n'), templateVersion:template.templateVersion||'1.0.0', classification:template.classification||note.classification||'OWNER_STAFF_INTERNAL' };
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
  const providerReceipt=await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: note.to,
    subject: msg.subject,
    text: msg.text
  });
  return { sent:true, providerMessageId:String(providerReceipt?.messageId||''), accepted:Array.isArray(providerReceipt?.accepted)?providerReceipt.accepted.length:0, rejected:Array.isArray(providerReceipt?.rejected)?providerReceipt.rejected.length:0 };
}
module.exports = { status, configured, buildMessage, sendNotification };
