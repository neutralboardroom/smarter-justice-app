const PUBLIC_PROFESSIONAL_DATA_SOURCE_VERSION = '1.0.0';

const PUBLIC_PROFESSIONAL_DATA_SOURCES = {
  'nys-attorney-registrations': {
    id: 'nys-attorney-registrations',
    name: 'NYS Attorney Registrations',
    professionalType: 'attorney',
    jurisdiction: 'New York',
    authorityLevel: 'primary',
    publisher: 'New York State Unified Court System',
    datasetId: 'eqw2-r5nb',
    landingPage: 'https://data.ny.gov/Transparency/NYS-Attorney-Registrations/eqw2-r5nb',
    resourceEndpoint: 'https://data.ny.gov/resource/eqw2-r5nb.json',
    metadataEndpoint: 'https://data.ny.gov/api/views/eqw2-r5nb',
    dataDictionary: 'https://data.ny.gov/api/views/eqw2-r5nb/files/93ee7205-690b-4ac0-a4be-c2d34b59781e?download=true&filename=OCA_NYSAttorneyRegistrations_DataDictionary.pdf',
    publicBasis: 'Information deemed public pursuant to 22 NYCRR 118.',
    postingFrequency: 'Quarterly',
    lastKnownUpdatedDate: '2026-07-18',
    supportedFilters: ['registrationNumber','firstName','lastName','county','status','city','state','companyName'],
    fields: [
      'registration_number','first_name','middle_name','last_name','suffix','company_name',
      'street_1','street_2','city','state','zip','zip_plus_four','country','county',
      'phone_number','year_admitted','judicial_department_of_admission','law_school','status'
    ],
    sourceUseRules: [
      'Import only fields published in the official public dataset.',
      'Record the dataset, retrieval time, registration number, and facts supported for each seeded profile.',
      'Keep imported profiles unclaimed and appointment-ineligible until all independent marketplace gates are satisfied.',
      'Do not infer practice area, professional quality, participation, availability, or endorsement from attorney-registration data.',
      'Use the official New York Courts attorney search for individual follow-up verification, correction review, and current-status confirmation when appropriate.',
      'Do not republish a large public directory until terms, privacy, security, correction, removal, and jurisdiction-specific legal review are complete.'
    ]
  }
};

module.exports = { PUBLIC_PROFESSIONAL_DATA_SOURCE_VERSION, PUBLIC_PROFESSIONAL_DATA_SOURCES };
