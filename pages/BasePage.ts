import { type Page } from '@playwright/test';
import { Table } from '../components/Table';

export class BasePage {
  readonly page: Page;
  readonly table: Table;

  constructor(page: Page) {
    this.page = page;
    this.table = new Table(page);
  }
}
