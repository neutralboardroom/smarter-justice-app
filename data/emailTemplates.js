const EMAIL_TEMPLATES = {
  professional_email_verification: {
    templateVersion: '1.0.0',
    classification: 'SECURITY_CRITICAL',
    subject: 'Verify your Smarter Justice professional account',
    purpose: 'Confirms the email address before professional sign-in, profile control, firm administration, or membership checkout.'
  },
  professional_password_reset: {
    templateVersion: '1.0.0',
    classification: 'SECURITY_CRITICAL',
    subject: 'Reset your Smarter Justice professional password',
    purpose: 'Provides a time-limited password-reset link requested for a professional account.'
  },
  free_question_received: {
    templateVersion: '1.0.0',
    classification: 'ACCOUNT_TRANSACTIONAL',
    subject: 'Smarter Justice received your starting question',
    purpose: 'Confirms the saved work was created and reminds the user to save the private return link.'
  },
  upload_received: {
    templateVersion: '1.0.0',
    classification: 'ACCOUNT_TRANSACTIONAL',
    subject: 'Smarter Justice received your upload',
    purpose: 'Confirms that uploaded documents were saved for review.'
  },
  private_continuation_link_requested: {
    templateVersion: '1.0.0',
    classification: 'ACCOUNT_TRANSACTIONAL',
    subject: 'Your private Smarter Justice continuation link',
    purpose: 'Sends the private return link so the user can return to the saved file.'
  },
  more_information_needed: {
    templateVersion: '1.0.0',
    classification: 'ACCOUNT_TRANSACTIONAL',
    subject: 'Smarter Justice needs one more detail',
    purpose: 'Explains what document or fact is needed before review can continue.'
  },
  payment_requested: {
    templateVersion: '1.0.0',
    classification: 'BILLING_TRANSACTIONAL',
    subject: 'Your Smarter Justice payment step',
    purpose: 'Explains the selected review step and links the user to payment when Stripe is configured.'
  },
  payment_received: {
    templateVersion: '1.0.0',
    classification: 'BILLING_TRANSACTIONAL',
    subject: 'Payment received by Smarter Justice',
    purpose: 'Confirms payment and tells the user the review/delivery step is in progress.'
  },
  file_ready: {
    templateVersion: '1.0.0',
    classification: 'ACCOUNT_TRANSACTIONAL',
    subject: 'Your Smarter Justice review package is ready',
    purpose: 'Tells the user that the organized package or supported forms can be opened from the dashboard.'
  },
  professional_review_recommended: {
    templateVersion: '1.0.0',
    classification: 'ACCOUNT_TRANSACTIONAL',
    subject: 'Professional review may be recommended',
    purpose: 'Explains when attorney, tax attorney, CPA, enrolled agent, accountant, or other review may be appropriate.'
  },
  community_partner_credit_update: {
    templateVersion: '1.0.0',
    classification: 'ACCOUNT_TRANSACTIONAL',
    subject: 'Community Partner credit update',
    purpose: 'Confirms referred starts and credit status for Community Partners.'
  }
};
module.exports = { EMAIL_TEMPLATES };
