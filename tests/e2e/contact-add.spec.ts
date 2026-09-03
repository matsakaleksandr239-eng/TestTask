import { test, expect } from '../../fixtures/fixturePages';
import { api } from '../../api';
import { ContactField, ContactValidationMessage } from '../../pages/ContactAddPage';
import { type TContactFormDetails, makeExpectedContactPayload, makeExpectedContactResponse } from '../../factories/contact';
import {
  REQUIRED_FIELD_MESSAGES,
  REQUIRED_FIELDS,
  INVALID_EMAILS,
  SPECIAL_CHARACTERS,
  ALLOWED_SPECIAL_CHARACTERS,
  OTHER_SCRIPT_CHARACTER,
  NAME_LIKE_FIELDS,
  LONG_TEXT,
} from '../../factories/contactValidation';

test.describe('Add Contact', () => {
  test.describe('UI checks', () => {
    test('has promotional emails checkbox checked by default', async ({ contactAddPage }) => {
      await contactAddPage.goto();

      await expect(contactAddPage.promoEmailsCheckbox).toBeChecked();
    });

    test('matches expected visual layout (screenshot)', async ({ contactAddPage }) => {
      await contactAddPage.goto();

      await expect(contactAddPage.form).toHaveScreenshot();
    });

    test('matches expected visual layout with a validation error (screenshot)', async ({ contactAddPage }) => {
      await contactAddPage.goto();

      await contactAddPage.fields[ContactField.FIRST_NAME].click();
      await contactAddPage.heading.click();

      await expect(contactAddPage.form).toHaveScreenshot();
    });

    test('does not overflow required fields with long text (screenshot)', async ({ contactAddPage }) => {
      await contactAddPage.goto();

      await contactAddPage.fillDetails({
        contactName: LONG_TEXT,
        firstName: LONG_TEXT,
        lastName: LONG_TEXT,
        email: LONG_TEXT,
        phoneNumber: LONG_TEXT,
      });

      await expect(contactAddPage.form).toHaveScreenshot();
    });
  });

  test.describe('Fields validation', () => {
    for (const field of REQUIRED_FIELDS) {
      test(`shows validation error when required field "${field}" is left empty and loses focus`, async ({ contactAddPage }) => {
        await contactAddPage.goto();

        await contactAddPage.fields[field].click();
        await contactAddPage.heading.click();

        await expect(contactAddPage.fieldErrorMessages[field]).toHaveText(REQUIRED_FIELD_MESSAGES[field]!);
        await expect(contactAddPage.fieldErrorIcons[field]).toBeVisible();
        for (const otherField of REQUIRED_FIELDS.filter((f) => f !== field)) {
          await expect(contactAddPage.fieldErrorMessages[otherField]).toHaveCount(0);
        }
      });

      test(`shows validation error when required field "${field}" is cleared`, async ({ contactAddPage }) => {
        await contactAddPage.goto();

        await contactAddPage.fillField(field, 'Test');
        await contactAddPage.fillField(field, '');
        await contactAddPage.heading.click();

        await expect(contactAddPage.fieldErrorMessages[field]).toHaveText(REQUIRED_FIELD_MESSAGES[field]!);
        await expect(contactAddPage.fieldErrorIcons[field]).toBeVisible();
        for (const otherField of REQUIRED_FIELDS.filter((f) => f !== field)) {
          await expect(contactAddPage.fieldErrorMessages[otherField]).toHaveCount(0);
        }
      });
    }

    test.fixme('shows validation error on all required fields when clicking Create on an incomplete form', async ({
      contactAddPage,
    }) => {
      await contactAddPage.goto();

      await contactAddPage.fillField(ContactField.FIRST_NAME, 'Test');
      await contactAddPage.fillField(ContactField.FIRST_NAME, '');
      await contactAddPage.submitButton.click();

      for (const field of REQUIRED_FIELDS) {
        await expect(contactAddPage.fieldErrorMessages[field]).toHaveText(REQUIRED_FIELD_MESSAGES[field]!);
      }
      await expect(contactAddPage.errorMessageIn(contactAddPage.phonePrefixContainer)).toBeVisible();
    });

    for (const invalidEmail of INVALID_EMAILS) {
      test(`shows validation error for invalid email format "${invalidEmail}"`, async ({ contactAddPage }) => {
        await contactAddPage.goto();
        await contactAddPage.fillField(ContactField.EMAIL, invalidEmail);
        await contactAddPage.heading.click();

        await expect(contactAddPage.fieldErrorMessages[ContactField.EMAIL]).toHaveText(ContactValidationMessage.INVALID_EMAIL);
        await expect(contactAddPage.fieldErrorIcons[ContactField.EMAIL]).toBeVisible();
      });
    }

    test.fixme('shows validation error for invalid email format "trailing.dot.@example.com"', async ({ contactAddPage }) => {
      await contactAddPage.goto();
      await contactAddPage.fillField(ContactField.EMAIL, 'trailing.dot.@example.com');
      await contactAddPage.heading.click();

      await expect(contactAddPage.fieldErrorMessages[ContactField.EMAIL]).toHaveText(ContactValidationMessage.INVALID_EMAIL);
      await expect(contactAddPage.fieldErrorIcons[ContactField.EMAIL]).toBeVisible();
    });

    test.fixme('shows validation error when Contact type/NAME contains digits', async ({ contactAddPage }) => {
      await contactAddPage.goto();
      await contactAddPage.fillDetails({ contactName: 'QA Invalid 123' });

      await contactAddPage.submitButton.click();

      await expect(contactAddPage.fieldErrorMessages[ContactField.CONTACT_TYPE_NAME]).toHaveText(ContactValidationMessage.NO_DIGITS_ALLOWED);
      await expect(contactAddPage.fieldErrorIcons[ContactField.CONTACT_TYPE_NAME]).toBeVisible();
    });

    for (const { field, detailsKey, buildValue } of NAME_LIKE_FIELDS) {
      for (const char of SPECIAL_CHARACTERS) {
        test(`shows validation error when ${field} contains "${char}"`, async ({ contactAddPage }) => {
          await contactAddPage.goto();
          await contactAddPage.fillDetails({ [detailsKey]: buildValue(char) } as Partial<TContactFormDetails>);

          await contactAddPage.submitButton.click();

          await expect(contactAddPage.fields[field]).toHaveAttribute('aria-invalid', 'true');
          await expect(contactAddPage.fieldErrorIcons[field]).toBeVisible();
        });
      }
    }

    for (const { field, detailsKey, buildValue } of NAME_LIKE_FIELDS) {
      test(`shows validation error when ${field} contains a different writing system`, async ({ contactAddPage }) => {
        await contactAddPage.goto();
        await contactAddPage.fillDetails({ [detailsKey]: buildValue(OTHER_SCRIPT_CHARACTER) } as Partial<TContactFormDetails>);

        await contactAddPage.submitButton.click();

        await expect(contactAddPage.fields[field]).toHaveAttribute('aria-invalid', 'true');
        await expect(contactAddPage.fieldErrorIcons[field]).toBeVisible();
      });
    }

    test('shows validation error when Phone number contains a non-digit character', async ({ contactAddPage }) => {
      await contactAddPage.goto();
      await contactAddPage.fillField(ContactField.PHONE_NUMBER, '5012345!');
      await contactAddPage.heading.click();

      await expect(contactAddPage.fieldErrorMessages[ContactField.PHONE_NUMBER]).toHaveText(ContactValidationMessage.ONLY_DIGITS);
      await expect(contactAddPage.fieldErrorIcons[ContactField.PHONE_NUMBER]).toBeVisible();
    });

    for (const length of [1, 4, 13, 14]) {
      test(`shows validation error when Phone number has ${length} digits`, async ({ contactAddPage }) => {
        await contactAddPage.goto();
        await contactAddPage.fillField(ContactField.PHONE_NUMBER, '5'.repeat(length));
        await contactAddPage.heading.click();

        await expect(contactAddPage.fieldErrorMessages[ContactField.PHONE_NUMBER]).toHaveText(ContactValidationMessage.PHONE_LENGTH);
        await expect(contactAddPage.fieldErrorIcons[ContactField.PHONE_NUMBER]).toBeVisible();
      });
    }

    for (const length of [5, 6]) {
      test.fixme(`shows validation error when Phone number has ${length} digits (server-only minimum)`, async ({
        contactAddPage,
      }) => {
        await contactAddPage.goto();
        await contactAddPage.fillField(ContactField.PHONE_NUMBER, '5'.repeat(length));
        await contactAddPage.heading.click();

        await expect(contactAddPage.fieldErrorMessages[ContactField.PHONE_NUMBER]).toHaveText(ContactValidationMessage.PHONE_LENGTH);
        await expect(contactAddPage.fieldErrorIcons[ContactField.PHONE_NUMBER]).toBeVisible();
      });
    }

    test.fixme('shows validation error when phone prefix is left empty and loses focus', async ({ contactAddPage }) => {
      await contactAddPage.goto();

      await contactAddPage.phonePrefixField.click();
      await contactAddPage.heading.click();

      await expect(contactAddPage.errorMessageIn(contactAddPage.phonePrefixContainer)).toBeVisible();
    });
  });

  test.describe('Functional checks', () => {
    test('creates a new contact with all checkboxes enabled', async ({ request, contactAddPage }) => {
      await contactAddPage.goto();
      const details = await contactAddPage.fillDetails();
      await contactAddPage.setCheckboxes({ promoEmails: true, productEmails: true, financeEmails: true });

      const beforeCreate = new Date();
      const { id, requestPayload } = await contactAddPage.submit();
      try {
        await api.contacts.verifyCreation(request, {
          id,
          actualPayload: requestPayload,
          expectedPayload: makeExpectedContactPayload(details, { product_emails: true, finance_emails: true }),
          expectedResponse: makeExpectedContactResponse(id, details, requestPayload, beforeCreate, {
            product_emails: true,
            finance_emails: true,
          }),
        });
      } finally {
        await api.contacts.remove(request, id);
      }
    });

    test('creates a new contact with all checkboxes disabled', async ({ request, contactAddPage }) => {
      await contactAddPage.goto();
      const details = await contactAddPage.fillDetails();
      await contactAddPage.setCheckboxes({ promoEmails: false, productEmails: false, financeEmails: false });

      const beforeCreate = new Date();
      const { id, requestPayload } = await contactAddPage.submit();
      try {
        await api.contacts.verifyCreation(request, {
          id,
          actualPayload: requestPayload,
          expectedPayload: makeExpectedContactPayload(details, { promo_emails: false }),
          expectedResponse: makeExpectedContactResponse(id, details, requestPayload, beforeCreate, { promo_emails: false }),
        });
      } finally {
        await api.contacts.remove(request, id);
      }
    });

    test('creates a new contact with all fields filled, including a comment', async ({ request, contactAddPage }) => {
      await contactAddPage.goto();
      const details = await contactAddPage.fillDetails({ comment: 'QA comment for full-fields case' });

      const beforeCreate = new Date();
      const { id, requestPayload } = await contactAddPage.submit();
      try {
        await api.contacts.verifyCreation(request, {
          id,
          actualPayload: requestPayload,
          expectedPayload: makeExpectedContactPayload(details),
          expectedResponse: makeExpectedContactResponse(id, details, requestPayload, beforeCreate),
        });
      } finally {
        await api.contacts.remove(request, id);
      }
    });

    test('creates a new contact when Contact type/NAME contains allowed special characters', async ({
      request,
      contactAddPage,
    }) => {
      await contactAddPage.goto();
      const details = await contactAddPage.fillDetails({ contactName: `QA${ALLOWED_SPECIAL_CHARACTERS}Name` });

      const { id, requestPayload } = await contactAddPage.submit();
      try {
        expect(requestPayload.name).toBe(details.contactName);

        const response = await request.get(`/api/contacts/${id}`);
        const { data } = await response.json();
        expect(data.contact.name).toBe(details.contactName);
      } finally {
        await api.contacts.remove(request, id);
      }
    });

    test('creates a new contact when Comment contains special characters', async ({ request, contactAddPage }) => {
      await contactAddPage.goto();
      const details = await contactAddPage.fillDetails({ comment: `Comment ${SPECIAL_CHARACTERS.join('')}` });

      const { id, requestPayload } = await contactAddPage.submit();
      try {
        expect(requestPayload.comment).toBe(details.comment);

        const response = await request.get(`/api/contacts/${id}`);
        const { data } = await response.json();
        expect(data.contact.comment).toBe(details.comment);
      } finally {
        await api.contacts.remove(request, id);
      }
    });

    test('creates a new contact when Comment contains a different writing system', async ({ request, contactAddPage }) => {
      await contactAddPage.goto();
      const details = await contactAddPage.fillDetails({ comment: `Comment ${OTHER_SCRIPT_CHARACTER}` });

      const { id, requestPayload } = await contactAddPage.submit();
      try {
        expect(requestPayload.comment).toBe(details.comment);

        const response = await request.get(`/api/contacts/${id}`);
        const { data } = await response.json();
        expect(data.contact.comment).toBe(details.comment);
      } finally {
        await api.contacts.remove(request, id);
      }
    });
  });
});
