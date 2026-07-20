const EMAIL_TEMPLATES = {
  free_question_received: {
    subject: 'Smarter Justice received your starting question',
    purpose: 'Confirms the starting file was created and reminds the user to save the private link.'
  },
  upload_received: {
    subject: 'Smarter Justice received your upload',
    purpose: 'Confirms that uploaded documents were saved for review.'
  },
  private_continuation_link_requested: {
    subject: 'Your private Smarter Justice continuation link',
    purpose: 'Sends the private link so the user can return to the saved file.'
  },
  more_information_needed: {
    subject: 'Smarter Justice needs one more detail',
    purpose: 'Explains what document or fact is needed before review can continue.'
  },
  payment_requested: {
    subject: 'Your Smarter Justice payment step',
    purpose: 'Explains the selected review step and links the user to payment when Stripe is configured.'
  },
  payment_received: {
    subject: 'Payment received by Smarter Justice',
    purpose: 'Confirms payment and tells the user the review/delivery step is in progress.'
  },
  file_ready: {
    subject: 'Your Smarter Justice review package is ready',
    purpose: 'Tells the user that the organized package or supported forms can be opened from the dashboard.'
  },
  professional_review_recommended: {
    subject: 'Professional review may be recommended',
    purpose: 'Explains when attorney, tax attorney, CPA, enrolled agent, accountant, or other review may be appropriate.'
  },
  community_partner_credit_update: {
    subject: 'Community Partner credit update',
    purpose: 'Confirms referred starts and credit status for Community Partners.'
  }
};
module.exports = { EMAIL_TEMPLATES };
