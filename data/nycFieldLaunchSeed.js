const NYC_FIELD_LAUNCH_STANDARD_VERSION = '1.0.0';

const NYC_FIELD_LAUNCH_LOCATIONS = [
  {
    id: 'NYC-DBK-COURTHOUSE-CORRIDOR',
    name: 'Downtown Brooklyn Courthouse and Legal-Office Corridor',
    borough: 'Brooklyn',
    area: 'Downtown Brooklyn',
    status: 'planning',
    propertyPermissionStatus: 'not verified',
    permitStatus: 'not verified',
    courthouseRestrictionStatus: 'not verified',
    insuranceStatus: 'not verified',
    publicCampaignCode: 'DBK-COURTS-PUBLIC',
    professionalCampaignCode: 'DBK-COURTS-PRO',
    publicSummary: 'Planned two-sided field launch serving public users and professionals near Downtown Brooklyn legal and courthouse traffic.',
    boundaries: ['No court or government affiliation', 'No legal advice by outreach staff', 'No confidential oral intake in public', 'No guaranteed leads or outcomes']
  },
  {
    id: 'NYC-LM-COURTHOUSE-CORRIDOR',
    name: 'Lower Manhattan Courthouse and Legal-Office Corridor',
    borough: 'Manhattan',
    area: 'Lower Manhattan',
    status: 'planning',
    propertyPermissionStatus: 'not verified',
    permitStatus: 'not verified',
    courthouseRestrictionStatus: 'not verified',
    insuranceStatus: 'not verified',
    publicCampaignCode: 'LM-COURTS-PUBLIC',
    professionalCampaignCode: 'LM-COURTS-PRO',
    publicSummary: 'Planned two-sided field launch serving public users and professionals near Lower Manhattan legal and courthouse traffic.',
    boundaries: ['No court or government affiliation', 'No legal advice by outreach staff', 'No confidential oral intake in public', 'No guaranteed leads or outcomes']
  }
];

const FIELD_EVENT_TYPES = [
  'kiosk-view',
  'public-qr-scan',
  'professional-qr-scan',
  'public-start-click',
  'professional-start-click',
  'portal-route-completed',
  'profile-search-started',
  'profile-claim-started',
  'professional-application-started',
  'professional-application-submitted',
  'professional-membership-paid',
  'human-review-interest',
  'follow-up-requested',
  'flyer-distributed',
  'office-visit',
  'conversation-completed'
];



const FIELD_ASSET_TYPES = ['tablecloth','kiosk front panel','kiosk side panel','public flyer','professional flyer','QR card','staff badge','office one-pager','digital landing page','other'];
const FIELD_ASSET_STATUSES = ['idea','copy drafting','copy approved','design pending','vendor specification pending','proof review','approved for print','printed','deployed','paused','retired'];

const NYC_FIELD_LAUNCH_ASSETS = [
  {
    id:'FIELD-ASSET-TABLECLOTH-001',
    assetCode:'SJ-JT-TABLECLOTH-01',
    name:'Smarter Justice / Justice Truck field tablecloth',
    assetType:'tablecloth',
    status:'vendor specification pending',
    language:'English primary; bilingual variant planned',
    dimensions:'Pending selected table and print vendor template',
    primaryBrand:'Smarter Justice',
    legacyLine:'Connected with Justice Truck',
    publicCampaignCode:'DBK-COURTS-PUBLIC',
    professionalCampaignCode:'DBK-COURTS-PRO',
    publicCopy:'Free AI-guided legal and tax starting help',
    professionalCopy:'Attorneys and tax professionals: join the founding professional network',
    complianceStatus:'Copy direction approved; final artwork, dimensions, vendor proof, accessibility, and non-affiliation review remain pending.',
    ownerNotes:'Smarter Justice is the broader network brand. Justice Truck is the original and continuing community-access and field-outreach brand. Use the appropriate primary brand for each asset without erasing the other.',
    updatedAt:''
  },
  {
    id:'FIELD-ASSET-KIOSK-FRONT-001',
    assetCode:'SJ-JT-KIOSK-FRONT-01',
    name:'Two-sided kiosk front display',
    assetType:'kiosk front panel',
    status:'copy approved',
    language:'English primary; Spanish support planned where appropriate',
    dimensions:'Pending kiosk hardware and vendor template',
    primaryBrand:'Smarter Justice',
    legacyLine:'Connected with Justice Truck',
    publicCampaignCode:'DBK-COURTS-PUBLIC',
    professionalCampaignCode:'DBK-COURTS-PRO',
    publicCopy:'I need legal or tax help — start with free AI-guided help',
    professionalCopy:'I am an attorney or tax professional — review founding membership',
    complianceStatus:'Separate public and professional entry paths; no court affiliation; no legal advice by staff; private facts stay on the user’s device.',
    ownerNotes:'Use large distance-readable type and distinct QR codes for each lane.',
    updatedAt:''
  },
  {
    id:'FIELD-ASSET-PUBLIC-FLYER-001',
    assetCode:'SJ-JT-PUBLIC-FLYER-01',
    name:'Public starting-help flyer',
    assetType:'public flyer',
    status:'copy drafting',
    language:'English and Spanish variants planned',
    dimensions:'US Letter and handout-card variants pending',
    primaryBrand:'Smarter Justice',
    legacyLine:'Building on the Justice Truck community-outreach tradition',
    publicCampaignCode:'DBK-COURTS-PUBLIC',
    professionalCampaignCode:'',
    publicCopy:'Not sure where to begin with a legal or tax problem? Start free.',
    professionalCopy:'',
    complianceStatus:'Must identify Smarter Justice as a private platform, not a law firm, court, or government agency.',
    ownerNotes:'QR should open the public story box, not a long generic page.',
    updatedAt:''
  },
  {
    id:'FIELD-ASSET-PRO-FLYER-001',
    assetCode:'SJ-JT-PRO-FLYER-01',
    name:'Founding professional network flyer',
    assetType:'professional flyer',
    status:'copy drafting',
    language:'English',
    dimensions:'US Letter and office leave-behind variants pending',
    primaryBrand:'Smarter Justice',
    legacyLine:'Connected with Justice Truck',
    publicCampaignCode:'',
    professionalCampaignCode:'DBK-COURTS-PRO',
    publicCopy:'',
    professionalCopy:'Claim your profile, manage your firm, and apply for low-priced founding membership.',
    complianceStatus:'No guaranteed leads, clients, matters, ranking, revenue, or outcomes.',
    ownerNotes:'Support concierge enrollment during office and courthouse-area outreach.',
    updatedAt:''
  },
  {
    id:'FIELD-ASSET-STOP-DV-SIDE-001',
    assetCode:'SJ-JT-STOP-DV-SIDE-01',
    name:'Stop Domestic Violence public-service side-panel visual',
    assetType:'kiosk side panel',
    status:'design pending',
    language:'English primary; Spanish adaptation and resource-language review pending',
    dimensions:'Pending tablecloth or kiosk side-panel vendor template',
    primaryBrand:'Smarter Justice',
    legacyLine:'Justice Truck public-service initiative',
    publicCampaignCode:'DBK-COURTS-PUBLIC',
    professionalCampaignCode:'DBK-COURTS-PRO',
    publicCopy:'The Stop Sign Project — discreet domestic-violence resource awareness — StopSignProject.org',
    professionalCopy:'Founding memberships help support free street-level navigation; no leads or cases are guaranteed.',
    complianceStatus:'Exact website URL and two owner-supplied artwork files recorded; current National Domestic Violence Hotline number verified. Final dimensions, vendor proof, artwork ownership record, accessibility, Spanish adaptation, destination availability, and non-affiliation review remain required before print deployment.',
    ownerNotes:'Use the clean sign artwork on the homepage and side panel; use the manufactured-sign photograph for the Our Story page. Use the image respectfully with the approved Justice Truck mark and clear Smarter Justice network relationship.',
    updatedAt:''
  }

];

const FIELD_CHANNELS = ['kiosk','table','street outreach','office visit','building visit','flyer','QR card','community partner','other'];
const FIELD_LANES = ['public','professional','mixed'];

module.exports = { NYC_FIELD_LAUNCH_STANDARD_VERSION, NYC_FIELD_LAUNCH_LOCATIONS, NYC_FIELD_LAUNCH_ASSETS, FIELD_ASSET_TYPES, FIELD_ASSET_STATUSES, FIELD_EVENT_TYPES, FIELD_CHANNELS, FIELD_LANES };
