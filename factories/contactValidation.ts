import { ContactField, ContactValidationMessage } from '../pages/AContactFormPage';
import { type TContactFormDetails } from './contact';

export const REQUIRED_FIELD_MESSAGES: Partial<Record<ContactField, ContactValidationMessage>> = {
  [ContactField.CONTACT_TYPE_NAME]: ContactValidationMessage.REQUIRED,
  [ContactField.FIRST_NAME]: ContactValidationMessage.REQUIRED,
  [ContactField.LAST_NAME]: ContactValidationMessage.REQUIRED,
  [ContactField.EMAIL]: ContactValidationMessage.INVALID_EMAIL,
  [ContactField.PHONE_NUMBER]: ContactValidationMessage.REQUIRED,
};
export const REQUIRED_FIELDS = Object.keys(REQUIRED_FIELD_MESSAGES) as ContactField[];

// Verified live against the API: each of these is rejected. Note the server accepts some shapes
// a generic "standard" email test list would flag as invalid (e.g. "no-tld@domain" has no TLD
// but passes), so this list is deliberately scoped to what THIS backend actually rejects.
export const INVALID_EMAILS = ['not-an-email', 'missing-domain@', '@missing-local.com', 'double@@at.com', 'spaces in@email.com'];

// Exact rule per field is unknown, so we probe a small representative set rather than every symbol.
export const SPECIAL_CHARACTERS = ['!', '@', '#'];
export const ALLOWED_SPECIAL_CHARACTERS = "'.-";
export const OTHER_SCRIPT_CHARACTER = 'А';

export const LONG_TEXT_LENGTH = 50;
export const LONG_TEXT = 'w'.repeat(LONG_TEXT_LENGTH);

// Verified live: Email and Comment accept these characters (e.g. "!" is valid in an email
// local-part, Comment has no format restriction), so only these fields are worth asserting on.
// Phone number is excluded too: it validates digits-only client-side and blocks the click, so the
// "click submit and expect a server error" scenario never applies to it — covered separately.
export const NAME_LIKE_FIELDS: {
  field: ContactField;
  detailsKey: keyof TContactFormDetails;
  buildValue: (char: string) => string;
}[] = [
  { field: ContactField.CONTACT_TYPE_NAME, detailsKey: 'contactName', buildValue: (c) => `QA${c}Name` },
  { field: ContactField.FIRST_NAME, detailsKey: 'firstName', buildValue: (c) => `John${c}` },
  { field: ContactField.LAST_NAME, detailsKey: 'lastName', buildValue: (c) => `Doe${c}` },
];
