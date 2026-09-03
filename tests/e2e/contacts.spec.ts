import { test, expect } from '../../fixtures/fixturePages';
import { makeContact } from '../../factories/contact';
import { api } from '../../api';

test.describe('Contacts', () => {
  test.describe('UI checks', () => {
    test.fixme('displays correct page texts and labels', async () => {});

    test.fixme('displays correct table column headers', async () => {});

    test.fixme('matches expected visual layout (screenshot)', async () => {});
  });
});

test.describe('Functional checks', () => {
  test.describe('Contacts', () => {
    // These tests read and mutate the same account's contacts table (creating/deleting rows,
    // searching by row position), so they run one at a time — otherwise a concurrently-running
    // test's contact can shift or hide another test's row (e.g. pushing Primary/Abuse off screen).
    test.describe.configure({ mode: 'serial' });

    test('displays the default Primary contact', async ({ contactsPage }) => {
      await contactsPage.goto();

      expect(await contactsPage.table.findRowByColumnValue('Name', 'Primary')).toBeGreaterThan(0);
    });

    test('displays the default Abuse contact', async ({ contactsPage }) => {
      await contactsPage.goto();

      expect(await contactsPage.table.findRowByColumnValue('Name', 'Abuse')).toBeGreaterThan(0);
    });

    test('displays a newly created custom contact', async ({ page, request, contactsPage }) => {
      const contact = makeContact();

      await contactsPage.goto();
      expect(await contactsPage.table.findRowByColumnValue('Contacts', contact.email)).toBe(0);

      const contactId = await api.contacts.create(request, contact);
      try {
        await page.reload({ waitUntil: 'networkidle' });
        expect(await contactsPage.table.findRowByColumnValue('Contacts', contact.email)).toBeGreaterThan(0);
      } finally {
        await api.contacts.remove(request, contactId);
      }
    });

    test('displays contact field values in the table and reflects edits made via the API', async ({
      page,
      request,
      contactsPage,
    }) => {
      const contact = makeContact();

      await contactsPage.goto();
      const contactId = await api.contacts.create(request, contact);
      try {
        await page.reload({ waitUntil: 'networkidle' });
        let rowNumber = await contactsPage.table.findRowByColumnValue('Contacts', contact.email);
        expect(rowNumber).toBeGreaterThan(0);

        await contactsPage.table.validateRowValues(rowNumber, [
          { column: 'Name', value: contact.name },
          { column: 'Contacts', value: contact.email },
        ]);

        const updatedContact = makeContact({ name: 'QA Updated Contact' });
        await api.contacts.update(request, contactId, updatedContact);
        await page.reload({ waitUntil: 'networkidle' });

        rowNumber = await contactsPage.table.findRowByColumnValue('Contacts', updatedContact.email);
        expect(rowNumber).toBeGreaterThan(0);
        await contactsPage.table.validateRowValues(rowNumber, [
          { column: 'Name', value: updatedContact.name },
          { column: 'Contacts', value: updatedContact.email },
        ]);
      } finally {
        await api.contacts.remove(request, contactId);
      }
    });

    test('cancels a contact deletion', async ({ page, request, contactsPage }) => {
      const contact = makeContact();

      await contactsPage.goto();
      const contactId = await api.contacts.create(request, contact);
      try {
        await page.reload({ waitUntil: 'networkidle' });
        const rowNumber = await contactsPage.table.findRowByColumnValue('Contacts', contact.email);
        expect(rowNumber).toBeGreaterThan(0);

        await contactsPage.deleteContact(rowNumber, { isDelete: false });

        expect(await contactsPage.table.findRowByColumnValue('Contacts', contact.email)).toBeGreaterThan(0);
      } finally {
        await api.contacts.remove(request, contactId);
      }
    });

    test('deletes an existing contact', async ({ page, request, contactsPage }) => {
      const contact = makeContact();

      await contactsPage.goto();
      const contactId = await api.contacts.create(request, contact);
      try {
        await page.reload({ waitUntil: 'networkidle' });
        const rowNumber = await contactsPage.table.findRowByColumnValue('Contacts', contact.email);
        expect(rowNumber).toBeGreaterThan(0);

        await contactsPage.deleteContact(rowNumber);

        await page.reload({ waitUntil: 'networkidle' });
        expect(await contactsPage.table.findRowByColumnValue('Contacts', contact.email)).toBe(0);
      } finally {
        // No-op if the test's own delete flow already succeeded — only matters if it failed
        // partway through and left the contact behind.
        await api.contacts.remove(request, contactId);
      }
    });
  });

  test.describe('Pagination', () => {
    test.fixme('navigates to the next page', async () => {});

    test.fixme('changes number of contacts shown per page', async () => {});
  });
});
