import { test, expect } from '../../fixtures/fixturePages';
import { api } from '../../api';
import { makeContact, makeExpectedContactPayload, makeExpectedContactResponse } from '../../factories/contact';
import { ContactField, ContactValidationMessage } from '../../pages/ContactAddPage';
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

test.describe('Edit Contact', () => {
  test.describe('UI checks', () => {
    test.fixme('displays correct page texts and labels', async () => {});

    test.fixme('displays correct form field labels', async () => {});

    test('has promotional emails checkbox checked by default', async ({ contactEditPage, existingContact }) => {
      await contactEditPage.goto(existingContact.id);

      await expect(contactEditPage.promoEmailsCheckbox).toBeChecked();
    });

    test('matches expected visual layout with a validation error (screenshot)', async ({ contactEditPage, existingContact }) => {
      await contactEditPage.goto(existingContact.id);

      await contactEditPage.fillField(ContactField.FIRST_NAME, '');
      await contactEditPage.heading.click();

      await expect(contactEditPage.form).toHaveScreenshot();
    });

    test('does not overflow required fields with long text (screenshot)', async ({ contactEditPage, existingContact }) => {
      await contactEditPage.goto(existingContact.id);

      await contactEditPage.fillDetails({
        contactName: LONG_TEXT,
        firstName: LONG_TEXT,
        lastName: LONG_TEXT,
        email: LONG_TEXT,
        phoneNumber: LONG_TEXT,
      });

      await expect(contactEditPage.form).toHaveScreenshot();
    });

    test('displays Cyrillic text in the Comment field', async ({ request, contactEditPage }) => {
      const contact = makeContact({ comment: 'Коментар' });
      const id = await api.contacts.create(request, contact);

      try {
        await contactEditPage.goto(id);

        await expect(contactEditPage.fields[ContactField.COMMENT]).toHaveValue(contact.comment);
      } finally {
        await api.contacts.remove(request, id);
      }
    });

    // Values must be predefined (not faker-random), otherwise every run renders different
    // text and the screenshot never matches the baseline.
    test('matches expected visual layout (screenshot)', async ({ request, contactsPage, contactEditPage }) => {
      const contact = makeContact({
        first_name: 'John',
        last_name: 'Smith',
        email: 'qa.fixed.screenshot@example.com',
        phone_number: '500000000',
      });
      const id = await api.contacts.create(request, contact);

      try {
        await contactsPage.goto();
        const rowNumber = await contactsPage.table.findRowByColumnValue('Contacts', contact.email);
        await contactsPage.openEdit(rowNumber);

        await expect(contactEditPage.form).toHaveScreenshot();
      } finally {
        await api.contacts.remove(request, id);
      }
    });
  });

  test.describe('Fields validation', () => {
    test('shows validation error when a field is cleared and loses focus', async ({ contactEditPage, existingContact }) => {
      await contactEditPage.goto(existingContact.id);

      await contactEditPage.fillField(ContactField.FIRST_NAME, '');
      await contactEditPage.heading.click();

      await expect(contactEditPage.fieldErrorMessages[ContactField.FIRST_NAME]).toHaveText(ContactValidationMessage.REQUIRED);
      await expect(contactEditPage.fieldErrorIcons[ContactField.FIRST_NAME]).toBeVisible();
    });

    for (const field of REQUIRED_FIELDS) {
      test(`shows validation error when required field "${field}" is cleared`, async ({ contactEditPage, existingContact }) => {
        await contactEditPage.goto(existingContact.id);

        await contactEditPage.fillField(field, '');
        await contactEditPage.heading.click();

        await expect(contactEditPage.fieldErrorMessages[field]).toHaveText(REQUIRED_FIELD_MESSAGES[field]!);
        await expect(contactEditPage.fieldErrorIcons[field]).toBeVisible();
        for (const otherField of REQUIRED_FIELDS.filter((f) => f !== field)) {
          await expect(contactEditPage.fieldErrorMessages[otherField]).toHaveCount(0);
        }
      });
    }

    for (const invalidEmail of INVALID_EMAILS) {
      test(`shows validation error for invalid email format "${invalidEmail}"`, async ({ contactEditPage, existingContact }) => {
        await contactEditPage.goto(existingContact.id);

        await contactEditPage.fillField(ContactField.EMAIL, invalidEmail);
        await contactEditPage.heading.click();

        await expect(contactEditPage.fieldErrorMessages[ContactField.EMAIL]).toHaveText(ContactValidationMessage.INVALID_EMAIL);
        await expect(contactEditPage.fieldErrorIcons[ContactField.EMAIL]).toBeVisible();
      });
    }

    // Defect: same as on Add — the server rejects this email, but the client shows no validation
    // error on blur. Left failing on purpose until a bug is filed.
    test.fixme('shows validation error for invalid email format "trailing.dot.@example.com"', async ({
      contactEditPage,
      existingContact,
    }) => {
      await contactEditPage.goto(existingContact.id);

      await contactEditPage.fillField(ContactField.EMAIL, 'trailing.dot.@example.com');
      await contactEditPage.heading.click();

      await expect(contactEditPage.fieldErrorMessages[ContactField.EMAIL]).toHaveText(ContactValidationMessage.INVALID_EMAIL);
      await expect(contactEditPage.fieldErrorIcons[ContactField.EMAIL]).toBeVisible();
    });

    test.fixme('shows validation error when Contact type/NAME contains digits', async ({ contactEditPage, existingContact }) => {
      await contactEditPage.goto(existingContact.id);
      await contactEditPage.fillField(ContactField.CONTACT_TYPE_NAME, 'QA Invalid 123');

      await contactEditPage.submitButton.click();

      await expect(contactEditPage.fieldErrorMessages[ContactField.CONTACT_TYPE_NAME]).toHaveText(ContactValidationMessage.NO_DIGITS_ALLOWED);
      await expect(contactEditPage.fieldErrorIcons[ContactField.CONTACT_TYPE_NAME]).toBeVisible();
    });

    for (const { field, buildValue } of NAME_LIKE_FIELDS) {
      for (const char of SPECIAL_CHARACTERS) {
        test(`shows validation error when ${field} contains "${char}"`, async ({ contactEditPage, existingContact }) => {
          await contactEditPage.goto(existingContact.id);

          await contactEditPage.fillField(field, buildValue(char));
          await contactEditPage.submitButton.click();

          await expect(contactEditPage.fields[field]).toHaveAttribute('aria-invalid', 'true');
          await expect(contactEditPage.fieldErrorIcons[field]).toBeVisible();
        });
      }
    }

    for (const { field, buildValue } of NAME_LIKE_FIELDS) {
      test(`shows validation error when ${field} contains a different writing system`, async ({
        contactEditPage,
        existingContact,
      }) => {
        await contactEditPage.goto(existingContact.id);

        await contactEditPage.fillField(field, buildValue(OTHER_SCRIPT_CHARACTER));
        await contactEditPage.submitButton.click();

        await expect(contactEditPage.fields[field]).toHaveAttribute('aria-invalid', 'true');
        await expect(contactEditPage.fieldErrorIcons[field]).toBeVisible();
      });
    }

    test('shows validation error when Phone number contains a non-digit character', async ({
      contactEditPage,
      existingContact,
    }) => {
      await contactEditPage.goto(existingContact.id);

      await contactEditPage.fillField(ContactField.PHONE_NUMBER, '5012345!');
      await contactEditPage.heading.click();

      await expect(contactEditPage.fieldErrorMessages[ContactField.PHONE_NUMBER]).toHaveText(ContactValidationMessage.ONLY_DIGITS);
      await expect(contactEditPage.fieldErrorIcons[ContactField.PHONE_NUMBER]).toBeVisible();
    });

    for (const length of [3, 4, 13, 14]) {
      test(`shows validation error when Phone number has ${length} digits`, async ({ contactEditPage, existingContact }) => {
        await contactEditPage.goto(existingContact.id);

        await contactEditPage.fillField(ContactField.PHONE_NUMBER, '5'.repeat(length));
        await contactEditPage.heading.click();

        await expect(contactEditPage.fieldErrorMessages[ContactField.PHONE_NUMBER]).toHaveText(ContactValidationMessage.PHONE_LENGTH);
        await expect(contactEditPage.fieldErrorIcons[ContactField.PHONE_NUMBER]).toBeVisible();
      });
    }

    // Defect: same gap as on Add — 5 and 6 digits pass the client silently and only get
    // rejected once actually submitted to the server. Left failing on purpose until a bug is filed.
    for (const length of [5, 6]) {
      test.fixme(`shows validation error when Phone number has ${length} digits (server-only minimum)`, async ({
        contactEditPage,
        existingContact,
      }) => {
        await contactEditPage.goto(existingContact.id);

        await contactEditPage.fillField(ContactField.PHONE_NUMBER, '5'.repeat(length));
        await contactEditPage.heading.click();

        await expect(contactEditPage.fieldErrorMessages[ContactField.PHONE_NUMBER]).toHaveText(ContactValidationMessage.PHONE_LENGTH);
        await expect(contactEditPage.fieldErrorIcons[ContactField.PHONE_NUMBER]).toBeVisible();
      });
    }
  });

  test.describe('Functional checks', () => {
    test('updates all fields and checkbox states', async ({ request, contactEditPage, existingContact }) => {
      const before = await request.get(`/api/contacts/${existingContact.id}`);
      const { data: beforeData } = await before.json();

      await contactEditPage.goto(existingContact.id);
      const newDetails = await contactEditPage.fillDetails({ comment: 'Updated comment' });
      await contactEditPage.setCheckboxes({ promoEmails: false, productEmails: true, financeEmails: true });

      const beforeSave = new Date();
      const { id, requestPayload } = await contactEditPage.submit();

      expect(requestPayload).toEqual({
        ...makeExpectedContactPayload(newDetails, { promo_emails: false, product_emails: true, finance_emails: true }),
        id,
      });

      const after = await request.get(`/api/contacts/${id}`);
      const { data } = await after.json();
      expect(data.contact).toEqual(
        makeExpectedContactResponse(id, newDetails, requestPayload, beforeSave, {
          promo_emails: false,
          product_emails: true,
          finance_emails: true,
          created_at: beforeData.contact.created_at,
        })
      );
    });

    test('updates all fields with all checkboxes enabled', async ({ request, contactEditPage, existingContact }) => {
      const before = await request.get(`/api/contacts/${existingContact.id}`);
      const { data: beforeData } = await before.json();

      await contactEditPage.goto(existingContact.id);
      const newDetails = await contactEditPage.fillDetails();
      await contactEditPage.setCheckboxes({ promoEmails: true, productEmails: true, financeEmails: true });

      const beforeSave = new Date();
      const { id, requestPayload } = await contactEditPage.submit();

      expect(requestPayload).toEqual({
        ...makeExpectedContactPayload(newDetails, { product_emails: true, finance_emails: true }),
        id,
      });

      const after = await request.get(`/api/contacts/${id}`);
      const { data } = await after.json();
      expect(data.contact).toEqual(
        makeExpectedContactResponse(id, newDetails, requestPayload, beforeSave, {
          product_emails: true,
          finance_emails: true,
          created_at: beforeData.contact.created_at,
        })
      );
    });

    test('updates all fields with all checkboxes disabled', async ({ request, contactEditPage, existingContact }) => {
      const before = await request.get(`/api/contacts/${existingContact.id}`);
      const { data: beforeData } = await before.json();

      await contactEditPage.goto(existingContact.id);
      const newDetails = await contactEditPage.fillDetails();
      await contactEditPage.setCheckboxes({ promoEmails: false, productEmails: false, financeEmails: false });

      const beforeSave = new Date();
      const { id, requestPayload } = await contactEditPage.submit();

      expect(requestPayload).toEqual({
        ...makeExpectedContactPayload(newDetails, { promo_emails: false }),
        id,
      });

      const after = await request.get(`/api/contacts/${id}`);
      const { data } = await after.json();
      expect(data.contact).toEqual(
        makeExpectedContactResponse(id, newDetails, requestPayload, beforeSave, {
          promo_emails: false,
          created_at: beforeData.contact.created_at,
        })
      );
    });

    test('updates Contact type/NAME with allowed special characters', async ({ request, contactEditPage, existingContact }) => {
      await contactEditPage.goto(existingContact.id);
      const newDetails = await contactEditPage.fillDetails({ contactName: `QA${ALLOWED_SPECIAL_CHARACTERS}Name` });

      const { id, requestPayload } = await contactEditPage.submit();
      expect(requestPayload.name).toBe(newDetails.contactName);

      const response = await request.get(`/api/contacts/${id}`);
      const { data } = await response.json();
      expect(data.contact.name).toBe(newDetails.contactName);
    });

    test('updates Comment with special characters', async ({ request, contactEditPage, existingContact }) => {
      await contactEditPage.goto(existingContact.id);
      const newDetails = await contactEditPage.fillDetails({ comment: `Comment ${SPECIAL_CHARACTERS.join('')}` });

      const { id, requestPayload } = await contactEditPage.submit();
      expect(requestPayload.comment).toBe(newDetails.comment);

      const response = await request.get(`/api/contacts/${id}`);
      const { data } = await response.json();
      expect(data.contact.comment).toBe(newDetails.comment);
    });

    test('updates Comment with a different writing system', async ({ request, contactEditPage, existingContact }) => {
      await contactEditPage.goto(existingContact.id);
      const newDetails = await contactEditPage.fillDetails({ comment: `Comment ${OTHER_SCRIPT_CHARACTER}` });

      const { id, requestPayload } = await contactEditPage.submit();
      expect(requestPayload.comment).toBe(newDetails.comment);

      const response = await request.get(`/api/contacts/${id}`);
      const { data } = await response.json();
      expect(data.contact.comment).toBe(newDetails.comment);
    });
  });
});
