import { type Locator, type Page, test } from '@playwright/test';

export class Table {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page, root: Locator = page.locator('table')) {
    this.page = page;
    this.root = root;
  }

  rowByNumber(rowNumber: number): Locator {
    return this.root.locator('tbody tr').nth(rowNumber - 1);
  }

  async findRowByColumnValue(columnName: string, value: string): Promise<number> {
    return test.step(`Find row where column "${columnName}" = "${value}"`, async () => {
      const headers = await this.root.locator('thead th').allTextContents();
      const columnIndex = headers.findIndex((header) => header.trim() === columnName);
      if (columnIndex === -1) {
        return 0;
      }

      const cellTexts = await this.root.locator('tbody tr').evaluateAll(
        (rows, colIndex) => rows.map((row) => row.querySelectorAll('td')[colIndex]?.textContent?.trim() ?? ''),
        columnIndex
      );
      const rowIndex = cellTexts.findIndex((text) => text === value);
      return rowIndex === -1 ? 0 : rowIndex + 1;
    });
  }
}
