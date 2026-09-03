import { test as base } from '@playwright/test';
import { ContactsPage } from '../pages/ContactsPage';
import { ContactAddPage } from '../pages/ContactAddPage';
import { ContactEditPage } from '../pages/ContactEditPage';
import { api } from '../api';
import { makeContact, type TContactPayload } from '../factories/contact';

export type TExistingContact = {
  id: number;
  contact: TContactPayload;
};

type TPages = {
  contactsPage: ContactsPage;
  contactAddPage: ContactAddPage;
  contactEditPage: ContactEditPage;
  existingContact: TExistingContact;
};

export const test = base.extend<TPages>({
  contactsPage: async ({ page }, use) => {
    await use(new ContactsPage(page));
  },
  contactAddPage: async ({ page }, use) => {
    await use(new ContactAddPage(page));
  },
  contactEditPage: async ({ page }, use) => {
    await use(new ContactEditPage(page));
  },
  existingContact: async ({ request }, use) => {
    const contact = makeContact();
    const id = await api.contacts.create(request, contact);
    await use({ id, contact });
    await api.contacts.remove(request, id);
  },
});

export { expect } from '@playwright/test';
