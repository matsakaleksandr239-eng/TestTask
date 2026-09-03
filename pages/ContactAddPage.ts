import { type Locator, type Page, test } from '@playwright/test';
import { AContactFormPage } from './AContactFormPage';

export { ContactField, ContactValidationMessage, type TContactCheckboxStates } from './AContactFormPage';

export class ContactAddPage extends AContactFormPage {
  constructor(page: Page) {
    super(page, 'Create new contact');
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Create' });
  }

  async goto(): Promise<void> {
    return test.step('Go to Add Contact page', async () => {
      await this.page.goto('/contacts/add', { waitUntil: 'networkidle' });
      await this.waitForLoad();
    });
  }
}
