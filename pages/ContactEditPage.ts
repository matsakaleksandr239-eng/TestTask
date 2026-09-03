import { type Locator, type Page, test } from '@playwright/test';
import { AContactFormPage } from './AContactFormPage';

export class ContactEditPage extends AContactFormPage {
  constructor(page: Page) {
    super(page, 'Edit contact');
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Save' });
  }

  async goto(id: number): Promise<void> {
    return test.step(`Go to Edit Contact page (id=${id})`, async () => {
      await this.page.goto(`/contacts/edit/${id}`, { waitUntil: 'networkidle' });
      await this.waitForLoad();
    });
  }
}
