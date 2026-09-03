import { type Locator, type Page, expect, test } from '@playwright/test';

export type TColumnValue = {
  column: string;
  value: string;
};

export class Table {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page, root: Locator = page.locator('table')) {
    this.page = page;
    this.root = root;
  }

  row(text: string): Locator {
    return this.root.locator('tbody tr').filter({ hasText: text });
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

  async validateRowValues(rowNumber: number, values: TColumnValue[]): Promise<void> {
    return test.step(`Validate row ${rowNumber} values`, async () => {
      const headers = await this.root.locator('thead th').allTextContents();
      const row = this.rowByNumber(rowNumber);

      for (const { column, value } of values) {
        const columnIndex = headers.findIndex((header) => header.trim() === column);
        if (columnIndex === -1) {
          throw new Error(`Column "${column}" not found. Available columns: ${headers.join(', ')}`);
        }
        await expect(row.locator('td').nth(columnIndex)).toHaveText(value);
      }
    });
  }
}
