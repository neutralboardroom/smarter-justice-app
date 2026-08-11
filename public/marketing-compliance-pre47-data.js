'use strict';
window.SJMarketingCompliancePre47 = Object.freeze({
  schemaVersion: '1.0.0',
  rulesetVersion: 'sj-marketing-compliance-2026-08-10-pre47',
  checkedAt: '2026-08-10',
  coverageClaim: 'PARTIAL_PRIMARY_SOURCE_RULESET_NO_BLANKET_COMPLIANCE_APPROVAL',
  fallback: 'HUMAN_REVIEW_REQUIRED',
  jurisdictions: {
    NY: {
      label: 'New York',
      status: 'VERIFIED_PRIMARY_CURRENT_PARTIAL_AUTOMATION',
      effectiveDate: '2026-06-01',
      source: 'https://www.nycourts.gov/LegacyPDFS/RULES/jointappellate/Signed%20Letter%20to%20DOS-Joint%20Order.pdf',
      sourcePage: 'https://www.nycourts.gov/rules/amendments-joint-rules-departments-appellate-division',
      rules: [
        {id:'NY-7.1-A-TRUTH', kind:'MISLEADING', automation:'HUMAN_REVIEW_REQUIRED', summary:'Rule 7.1(a) prohibits false or misleading communications about a lawyer or the lawyer’s services.'},
        {id:'NY-7.1-C-SPECIALIST', kind:'SPECIALIST', automation:'BLOCK_OR_HUMAN_REVIEW', summary:'Rule 7.1(c) restricts specialist-certification statements and requires identification of the certifying organization when the exception applies.'},
        {id:'NY-7.1-D-RESPONSIBLE', kind:'RESPONSIBLE_IDENTITY', automation:'DETERMINISTIC_REQUIRED_FIELD', summary:'Rule 7.1(d) requires the name and contact information of at least one lawyer or law firm responsible for the communication.'},
        {id:'NY-7.3-LIVE-SOLICITATION', kind:'SOLICITATION', automation:'BLOCK_OR_HUMAN_REVIEW', summary:'Rule 7.3 restricts live person-to-person solicitation for pecuniary gain, subject to stated relationship/business exceptions, and bars solicitation after a no-contact request or involving coercion, duress, or harassment.'}
      ]
    },
    FL: {
      label: 'Florida',
      status: 'VERIFIED_PRIMARY_CURRENT_PARTIAL_AUTOMATION',
      effectiveDate: '2026-07-01',
      filingSource: 'https://www.floridabar.org/ethics/etad/advertising-filing-requirements/',
      advertisingSource: 'https://www.floridabar.org/ethics/etad/',
      aiSource: 'https://www.floridabar.org/etopinions/opinion-24-1/',
      rules: [
        {id:'FL-4-7.19-FILING', kind:'FILING_REVIEW', automation:'HUMAN_REVIEW_REQUIRED', summary:'Certain non-exempt direct mail/direct email and other advertisements must be filed at least 20 days before first use; exact exemptions and applicability require review.'},
        {id:'FL-2026-FILING-FEES', kind:'FILING_FEE', automation:'INFORMATIONAL', summary:'Effective July 1, 2026, the Florida Bar states timely filing is $250 and late filing is $750.'},
        {id:'FL-OP-24-1-AI-DISCLOSURE', kind:'AI_DISCLOSURE', automation:'DETERMINISTIC_TEXT_CHECK', summary:'Florida Ethics Opinion 24-1 says a generative-AI chatbot communicating with clients or third parties must disclose that it is an AI program and not a lawyer or employee of the law firm.'}
      ]
    },
    TX: {
      label: 'Texas',
      status: 'VERIFIED_PRIMARY_CURRENT_PARTIAL_AUTOMATION',
      effectiveDate: null,
      source: 'https://www.texasbar.com/Content/NavigationMenu/ForLawyers/AdvertisingReview/default.htm',
      typesSource: 'https://www.texasbar.com/Content/NavigationMenu/ForLawyers/MembershipInformation/AdvertisingReview2/TypesOfAds.htm',
      rules: [
        {id:'TX-PART-VII-REVIEW', kind:'FILING_REVIEW', automation:'HUMAN_REVIEW_REQUIRED', summary:'Texas Advertising Review administers review of attorney and law-firm advertisements and solicitation communications under Part VII; most public marketing must be submitted unless an exemption applies.'},
        {id:'TX-AD-REVIEW-FEE', kind:'FILING_FEE', automation:'INFORMATIONAL', summary:'The State Bar of Texas Advertising Review page currently lists a $100 application fee.'}
      ]
    }
  }
});
