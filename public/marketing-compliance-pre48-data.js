'use strict';
window.SJMarketingCompliancePre48 = Object.freeze({
  schemaVersion: '1.0.0',
  rulesetVersion: 'sj-marketing-compliance-2026-08-10-pre48-five-jurisdiction-partial',
  checkedAt: '2026-08-10',
  coverageClaim: 'PARTIAL_PRIMARY_SOURCE_RULESET_NO_BLANKET_COMPLIANCE_APPROVAL',
  fallback: 'HUMAN_REVIEW_REQUIRED',
  jurisdictions: {
    NY: {
      label: 'New York', status: 'VERIFIED_PRIMARY_CURRENT_PARTIAL_AUTOMATION', effectiveDate: '2026-06-01',
      source: 'https://www.nycourts.gov/LegacyPDFS/RULES/jointappellate/Signed%20Letter%20to%20DOS-Joint%20Order.pdf',
      sourcePage: 'https://www.nycourts.gov/rules/amendments-joint-rules-departments-appellate-division',
      rules: [
        {id:'NY-7.1-A-TRUTH',kind:'MISLEADING',automation:'HUMAN_REVIEW_REQUIRED',summary:'Rule 7.1(a) prohibits false or misleading communications about a lawyer or the lawyer’s services.'},
        {id:'NY-7.1-C-SPECIALIST',kind:'SPECIALIST',automation:'BLOCK_OR_HUMAN_REVIEW',summary:'Rule 7.1(c) restricts specialist-certification statements and requires identification of the certifying organization when the exception applies.'},
        {id:'NY-7.1-D-RESPONSIBLE',kind:'RESPONSIBLE_IDENTITY',automation:'DETERMINISTIC_REQUIRED_FIELD',summary:'Rule 7.1(d) requires the name and contact information of at least one lawyer or law firm responsible for the communication.'},
        {id:'NY-7.3-LIVE-SOLICITATION',kind:'SOLICITATION',automation:'BLOCK_OR_HUMAN_REVIEW',summary:'Rule 7.3 restricts live person-to-person solicitation for pecuniary gain, subject to stated relationship/business exceptions, and bars solicitation after a no-contact request or involving coercion, duress, or harassment.'}
      ]
    },
    FL: {
      label:'Florida',status:'VERIFIED_PRIMARY_CURRENT_PARTIAL_AUTOMATION',effectiveDate:'2026-07-01',
      filingSource:'https://www.floridabar.org/ethics/etad/advertising-filing-requirements/', advertisingSource:'https://www.floridabar.org/ethics/etad/', aiSource:'https://www.floridabar.org/etopinions/opinion-24-1/',
      rules:[
        {id:'FL-4-7.19-FILING',kind:'FILING_REVIEW',automation:'HUMAN_REVIEW_REQUIRED',summary:'Certain non-exempt direct mail/direct email and other advertisements must be filed at least 20 days before first use; exact exemptions and applicability require review.'},
        {id:'FL-2026-FILING-FEES',kind:'FILING_FEE',automation:'INFORMATIONAL',summary:'Effective July 1, 2026, the Florida Bar states timely filing is $250 and late filing is $750.'},
        {id:'FL-OP-24-1-AI-DISCLOSURE',kind:'AI_DISCLOSURE',automation:'DETERMINISTIC_TEXT_CHECK',summary:'Florida Ethics Opinion 24-1 says a generative-AI chatbot communicating with clients or third parties must disclose that it is an AI program and not a lawyer or employee of the law firm.'}
      ]
    },
    TX: {
      label:'Texas',status:'VERIFIED_PRIMARY_CURRENT_PARTIAL_AUTOMATION',effectiveDate:null,
      source:'https://www.texasbar.com/Content/NavigationMenu/ForLawyers/AdvertisingReview/default.htm', typesSource:'https://www.texasbar.com/Content/NavigationMenu/ForLawyers/MembershipInformation/AdvertisingReview2/TypesOfAds.htm',
      rules:[
        {id:'TX-PART-VII-REVIEW',kind:'FILING_REVIEW',automation:'HUMAN_REVIEW_REQUIRED',summary:'Texas Advertising Review administers review of attorney and law-firm advertisements and solicitation communications under Part VII; most public marketing must be submitted unless an exemption applies.'},
        {id:'TX-AD-REVIEW-FEE',kind:'FILING_FEE',automation:'INFORMATIONAL',summary:'The State Bar of Texas Advertising Review page currently lists a $100 application fee.'}
      ]
    },
    CA: {
      label:'California',status:'VERIFIED_PRIMARY_CURRENT_PARTIAL_AUTOMATION',effectiveDate:'2026-06-01',
      source:'https://www.calbar.ca.gov/Attorneys/Conduct-Discipline/Rules/Rules-of-Professional-Conduct/Current-Rules/Chapter-7-Information-About-Legal-Services',
      amendmentSource:'https://www.calbar.ca.gov/About-Us/News/Ethics-News',
      rules:[
        {id:'CA-7.1-TRUTH',kind:'MISLEADING',automation:'HUMAN_REVIEW_REQUIRED',summary:'Rule 7.1 prohibits false or misleading communications about a lawyer or the lawyer’s services.'},
        {id:'CA-7.2-C-RESPONSIBLE',kind:'RESPONSIBLE_IDENTITY',automation:'DETERMINISTIC_REQUIRED_FIELD',summary:'Rule 7.2(c) requires the name and address of at least one lawyer or law firm responsible for an advertising communication.'},
        {id:'CA-7.3-LIVE-CONTACT',kind:'LIVE_SOLICITATION',automation:'BLOCK_OR_HUMAN_REVIEW',summary:'Rule 7.3(a) restricts in-person, live telephone, or real-time electronic solicitation for pecuniary gain except for specified relationships.'},
        {id:'CA-7.3-NO-CONTACT',kind:'SOLICITATION_SUPPRESSION',automation:'BLOCK_OR_HUMAN_REVIEW',summary:'Rule 7.3(b) bars solicitation after a recipient has made known a desire not to be solicited and bars intrusion, coercion, duress, or harassment.'},
        {id:'CA-7.3-ADVERTISEMENT-LABEL',kind:'SOLICITATION_LABEL',automation:'DETERMINISTIC_TEXT_CHECK_PLUS_HUMAN_REVIEW',summary:'Rule 7.3(c) requires Advertisement or words of similar import for certain targeted written, recorded, or electronic solicitations, subject to stated exceptions and context.'},
        {id:'CA-7.3-F-DVRO',kind:'DVRO_SOLICITATION',automation:'BLOCK_OR_HUMAN_REVIEW',summary:'Effective June 1, 2026, Rule 7.3(f) restricts soliciting a respondent in a domestic-violence restraining-order proceeding until after service and docketed proof of service, subject to the rule’s current/former-client exception.'}
      ]
    },
    NJ: {
      label:'New Jersey',status:'VERIFIED_PRIMARY_CURRENT_PARTIAL_AUTOMATION',effectiveDate:'2025-12-08',
      rulesSource:'https://www.njcourts.gov/attorneys/rules-of-court/advertising',
      testimonialSource:'https://www.njcourts.gov/notices/committee-attorney-advertising-opinion-49-use-of-client-endorsements-and-testimonials',
      keywordSource:'https://www.njcourts.gov/notices/advisory-committee-professional-ethics-acpe-opinion-735-supplement-lawyers-use-of-internet',
      rules:[
        {id:'NJ-7.1-TRUTH',kind:'MISLEADING',automation:'HUMAN_REVIEW_REQUIRED',summary:'RPC 7.1 restricts false or misleading communications and unjustified expectations.'},
        {id:'NJ-CAA-49-TESTIMONIAL-ID',kind:'TESTIMONIAL_IDENTITY',automation:'DETERMINISTIC_CONTEXT_CHECK_PLUS_HUMAN_REVIEW',summary:'CAA Opinion 49 states that the person making an endorsement or testimonial should be identified in the advertising.'},
        {id:'NJ-CAA-49-RESULTS-DISCLAIMER',kind:'TESTIMONIAL_RESULTS',automation:'DETERMINISTIC_TEXT_CHECK_PLUS_HUMAN_REVIEW',summary:'CAA Opinion 49 requires a results-may-vary disclaimer when a testimonial or endorsement contains statements regarding past performance.'},
        {id:'NJ-CAA-49-COMPARISON',kind:'TESTIMONIAL_COMPARISON',automation:'BLOCK_OR_HUMAN_REVIEW',summary:'CAA Opinion 49 states comparative language such as best, only, top, or ultimate is not permitted in endorsements or testimonials.'},
        {id:'NJ-CAA-49-NO-PAYMENT',kind:'TESTIMONIAL_PAYMENT',automation:'BLOCK_OR_HUMAN_REVIEW',summary:'CAA Opinion 49 states lawyers cannot pay for endorsements or testimonials.'},
        {id:'NJ-7.2-RECORD-RETENTION',kind:'RECORD_RETENTION',automation:'INFORMATIONAL_PLUS_HUMAN_REVIEW',summary:'RPC 7.2 requires advertising records to be retained and requires website material to be captured or backed up; exact retention practice should be reviewed against the current rule.'},
        {id:'NJ-ACPE-735-KEYWORD-DISCLAIMER',kind:'COMPETITIVE_KEYWORD',automation:'DETERMINISTIC_TEXT_CHECK_PLUS_HUMAN_REVIEW',summary:'The New Jersey Supreme Court/ACPE guidance requires a prominent landing-page disclaimer when paid keyword advertising purchases a competitor lawyer or firm name.'}
      ]
    }
  }
});
