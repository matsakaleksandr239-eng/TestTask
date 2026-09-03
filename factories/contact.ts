import { faker } from '@faker-js/faker';
import { Country, type TCountry } from './country';
import { isDateWithinTolerance } from '../utils/matchers';

export type TContactPayload = {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_prefix: string;
  phone_number: string;
  comment: string;
  support_requests: boolean;
  promo_emails: boolean;
  abuse_emails: boolean;
  product_emails: boolean;
  finance_emails: boolean;
};

// name/first_name/last_name reject digits, so uniqueness goes into the email instead.
export function makeContact(overrides: Partial<TContactPayload> = {}): TContactPayload {
  return {
    name: 'QA Custom Contact',
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: `pw.${faker.string.uuid()}@example.com`,
    phone_prefix: '380',
    phone_number: faker.string.numeric(9),
    comment: '',
    support_requests: false,
    promo_emails: true,
    abuse_emails: false,
    product_emails: false,
    finance_emails: false,
    ...overrides,
  };
}

export type TContactFormDetails = {
  contactName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryIso: TCountry;
  phoneNumber: string;
  comment?: string;
};

export function makeContactFormDetails(overrides: Partial<TContactFormDetails> = {}): TContactFormDetails {
  return {
    contactName: 'QA Custom Contact',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `pw.${faker.string.uuid()}@example.com`,
    phoneCountryIso: Country.UA,
    phoneNumber: faker.string.numeric({ length: { min: 7, max: 12 } }),
    ...overrides,
  };
}

// Mirrors the form's own defaults (matches makeContact() above), so a test only needs to pass the
// fields that differ from a freshly-created, all-default contact.
export function makeExpectedContactPayload(
  details: TContactFormDetails,
  overrides: Partial<TContactPayload> = {}
): TContactPayload {
  return {
    name: details.contactName,
    first_name: details.firstName,
    last_name: details.lastName,
    email: details.email,
    phone_prefix: details.phoneCountryIso.code,
    phone_number: details.phoneNumber,
    comment: details.comment ?? '',
    support_requests: false,
    promo_emails: true,
    abuse_emails: false,
    product_emails: false,
    finance_emails: false,
    ...overrides,
  };
}

export function makeExpectedContactResponse(
  id: number,
  details: TContactFormDetails,
  requestPayload: TContactPayload,
  beforeCreate: Date,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id,
    name: details.contactName,
    first_name: details.firstName,
    last_name: details.lastName,
    email: details.email,
    phone: `+${requestPayload.phone_prefix}.${requestPayload.phone_number}`,
    comment: details.comment ?? null,
    primary: false,
    abuse: false,
    support_requests: false,
    promo_emails: true,
    abuse_emails: false,
    product_emails: false,
    finance_emails: false,
    created_at: isDateWithinTolerance(beforeCreate),
    updated_at: isDateWithinTolerance(beforeCreate),
    ...overrides,
  };
}
