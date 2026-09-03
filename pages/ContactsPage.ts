import { type Locator, type Page, type Request, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class ContactsPage extends BasePage {
  readonly heading: Locator;
  readonly deleteDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Contacts', exact: true });
    this.deleteDialog = page.getByRole('dialog');
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

  async deleteContact(rowNumber: number, options: { isDelete?: boolean } = {}): Promise<void> {
    const { isDelete = true } = options;

    await this.clickDeleteButton(rowNumber);
    if (!isDelete) {
      let deleteRequestSent = false;
      const trackDeleteRequest = (request: Request): void => {
        if (request.method() === 'DELETE' && request.url().includes('/api/contacts/remove/')) {
          deleteRequestSent = true;
        }
      };

      this.page.on('request', trackDeleteRequest);
      await this.cancelDelete();
      // Exception: bounded wait to assert a negative — Cancel must not fire a delete request.
      await this.page.waitForTimeout(2000);
      this.page.off('request', trackDeleteRequest);

      if (deleteRequestSent) {
        throw new Error('Delete request was sent despite cancelling the deletion');
      }
      return;
    }

    const responsePromise = this.page.waitForResponse(
      (response) => response.request().method() === 'DELETE' && response.url().includes('/api/contacts/remove/')
    );
    await this.confirmDelete();
    const response = await responsePromise;
    if (!response.ok()) {
      throw new Error(`Delete contact request failed: ${response.status()}`);
    }
  }

  private async clickDeleteButton(rowNumber: number): Promise<void> {
    await this.table.rowByNumber(rowNumber).getByRole('button').nth(1).click();
  }

  private async confirmDelete(): Promise<void> {
    await this.deleteDialog.getByRole('button', { name: 'OK' }).click();
  }

  private async cancelDelete(): Promise<void> {
    await this.deleteDialog.getByRole('button', { name: 'Cancel' }).click();
  }
}
