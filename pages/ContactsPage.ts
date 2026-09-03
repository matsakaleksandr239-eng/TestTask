import { type Locator, type Page, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class ContactsPage extends BasePage {
  readonly heading: Locator;
  readonly addContactButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Contacts', exact: true });
    this.addContactButton = page.getByRole('button', { name: '+ Add New Contact' });
  }

  async goto(): Promise<void> {
    return test.step('Go to Contacts page', async () => {
      await this.page.goto('/contacts', { waitUntil: 'networkidle' });
      await this.heading.waitFor({ state: 'visible' });
    });
  }

  // Row buttons are icon-only with no accessible name: Edit is first, Delete is second.
  async openEdit(rowNumber: number): Promise<void> {
    await this.table.rowByNumber(rowNumber).getByRole('button').nth(0).click();
    await this.page.waitForURL(/\/contacts\/edit\//);
  }
}
