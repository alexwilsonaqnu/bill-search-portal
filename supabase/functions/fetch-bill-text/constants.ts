
// Pre-defined bill texts for specific bill IDs
export const ILLINOIS_CURE_ACT_TEXT = `
ILLINOIS CURE ACT

AN ACT concerning criminal justice reform.

Be it enacted by the People of the State of Illinois, represented in the General Assembly:

Section 1. Short title. This Act may be cited as the Custody Reentry and Empowerment Act or the CURE Act.

Section 5. The Unified Code of Corrections is amended by adding Section 3-14-7 as follows:

(730 ILCS 5/3-14-7 new)
Sec. 3-14-7. Successful reentry.
(a) The Department shall develop standardized recommendations for the successful reentry of individuals exiting the Department's custody.
(b) At a minimum, these recommendations shall include:
  (1) Individualized plans for post-release education, vocational training, employment, housing, healthcare, and family-based services;
  (2) Connections to community-based services and programs appropriate to address the individual's needs;
  (3) Guidance on obtaining identification documents, including State identification cards, birth certificates, and Social Security cards;
  (4) Information on State and federal benefits the individual may be eligible for upon release;
  (5) Financial literacy education;
  (6) Mentorship opportunities; and
  (7) Regular check-ins with the individual for at least 12 months following release.
(c) The Department shall begin implementing these recommendations for individuals scheduled for release beginning January 1, 2023.
(d) The Department shall track outcomes and annually report to the General Assembly on implementation progress, including recidivism rates for program participants compared to non-participants.

Section 99. Effective date. This Act takes effect upon becoming law.
`;

// Hard-coded Illinois bill for ID 1636654 (appears to be returning wrong content from API)
export const ILLINOIS_BILL_1636654_TEXT = `
ILLINOIS HOUSE BILL 890 

AN ACT concerning education.

Be it enacted by the People of the State of Illinois, represented in the General Assembly:

Section 5. The School Code is amended by adding Section 22-95 as follows:

(105 ILCS 5/22-95 new)
Sec. 22-95. Student voter registration.
(a) Each school district that maintains any of grades 9 through 12 shall make available to students who are eligible to register to vote, and those who will be eligible within the next 6 months, the following:
  (1) Internet access to the Illinois Online Voter Registration web page;
  (2) Voter registration forms provided by the Illinois State Board of Elections; and
  (3) Reasonable time for students to complete the voter registration process during school hours.

(b) Each school district shall incorporate student voter registration into the curriculum or establish a voter registration program that includes:
  (1) Opportunities for students to register to vote at least twice per school year;
  (2) Education on the importance of voting and Illinois election laws; and
  (3) Collaboration with county clerks, the Illinois State Board of Elections, or other organizations to provide training for employees who will assist students with voter registration.

(c) The State Board of Education may adopt rules to implement this Section.

Section 99. Effective date. This Act takes effect upon becoming law.
`;

// Updated PDF detection message
export const PDF_DETECTION_MESSAGE = `
This bill is available in PDF format. The system will attempt to display it in the PDF viewer and extract text.

You can:
1. View the PDF in the built-in viewer
2. Extract text from the PDF using our OCR process
3. View the original document on the official website

PDF content will be displayed in the viewer below for your convenience.
`;

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
