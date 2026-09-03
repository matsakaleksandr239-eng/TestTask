import { type Locator, type Page, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { makeContactFormDetails, type TContactFormDetails, type TContactPayload } from '../factories/contact';

export enum ContactField {
  CONTACT_TYPE_NAME = 'Contact type/NAME',
  FIRST_NAME = 'First Name',
  LAST_NAME = 'Last Name',
  EMAIL = 'Email',
  PHONE_NUMBER = 'Phone number',
  COMMENT = 'Comment (optional)',
}

export enum ContactValidationMessage {
  REQUIRED = 'This field is required',
  INVALID_EMAIL = 'Please enter valid email',
  ONLY_DIGITS = 'Only digits are allowed',
  PHONE_LENGTH = 'Must be between 5 and 12 characters long',
  // Assumed text — no message is actually shown today (see the test.fixme referencing this).
  NO_DIGITS_ALLOWED = 'Digits are not allowed',
}

export type TContactCheckboxStates = {
  promoEmails?: boolean;
  productEmails?: boolean;
  financeEmails?: boolean;
};

export type TSubmitContactResult = {
  id: number;
  requestPayload: TContactPayload;
};

export abstract class AContactFormPage extends BasePage {
  readonly heading: Locator;
  readonly form: Locator;
  readonly promoEmailsCheckbox: Locator;
  readonly productEmailsCheckbox: Locator;
  readonly financeEmailsCheckbox: Locator;
  readonly phonePrefixField: Locator;
  readonly phonePrefixContainer: Locator;
  readonly fields: Record<ContactField, Locator>;
  readonly fieldErrorMessages: Record<ContactField, Locator>;
  readonly fieldErrorIcons: Record<ContactField, Locator>;

  protected constructor(page: Page, headingName: string) {
    super(page);
    this.heading = page.getByRole('heading', { name: headingName, exact: true });
    this.form = page.locator('.va-form');
    // The form also has 2 conditionally hidden checkboxes (support requests, abuse emails) before/between
    // these — getByRole only returns visible ones, so promo/product/finance always land at 0/1/2.
    const visibleCheckboxes = this.form.getByRole('checkbox');
    this.promoEmailsCheckbox = visibleCheckboxes.nth(0);
    this.productEmailsCheckbox = visibleCheckboxes.nth(1);
    this.financeEmailsCheckbox = visibleCheckboxes.nth(2);
    this.phonePrefixField = page.locator('.country-intl-input');
    this.phonePrefixContainer = page.locator('div.relative').filter({ has: page.getByText('Phone prefix') });
    this.fields = this.buildFieldLocators((container) => container.locator('input').first());
    this.fieldErrorMessages = this.buildFieldLocators(this.errorMessageIn);
    this.fieldErrorIcons = this.buildFieldLocators((container) => container.locator('.va-input-wrapper__icon--error'));
  }

  abstract get submitButton(): Locator;

  // `networkidle` only means the network went quiet, not that the SPA finished rendering this
  // route's form — wait for the heading so callers never act on a half-mounted page.
  protected async waitForLoad(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
  }

  async fillField(field: ContactField, value: string): Promise<void> {
    return test.step(`Fill "${field}" with "${value}"`, async () => {
      await this.fields[field].fill(value);
    });
  }

  async fillDetails(overrides: Partial<TContactFormDetails> = {}): Promise<TContactFormDetails> {
    const details = makeContactFormDetails(overrides);

    await this.fillField(ContactField.CONTACT_TYPE_NAME, details.contactName);
    await this.fillField(ContactField.FIRST_NAME, details.firstName);
    await this.fillField(ContactField.LAST_NAME, details.lastName);
    await this.fillField(ContactField.EMAIL, details.email);
    // On Edit, the already-selected country label overlays this input and intercepts the click.
    await this.page.locator('.country-intl-input').click({ force: true });
    await this.page.locator(`li.vue-country-item[data-iso="${details.phoneCountryIso}"]`).click();
    await this.fillField(ContactField.PHONE_NUMBER, details.phoneNumber);
    if (details.comment) {
      await this.fillField(ContactField.COMMENT, details.comment);
    }

    return details;
  }

  async setCheckboxes(states: TContactCheckboxStates): Promise<void> {
    return test.step(`Set checkboxes: ${JSON.stringify(states)}`, async () => {
      if (states.promoEmails !== undefined) {
        await this.setCheckbox(this.promoEmailsCheckbox, states.promoEmails);
      }
      if (states.productEmails !== undefined) {
        await this.setCheckbox(this.productEmailsCheckbox, states.productEmails);
      }
      if (states.financeEmails !== undefined) {
        await this.setCheckbox(this.financeEmailsCheckbox, states.financeEmails);
      }
    });
  }

  async submit(): Promise<TSubmitContactResult> {
    const responsePromise = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && response.url().includes('/api/contacts/store')
    );
    await this.submitButton.click();
    const response = await responsePromise;
    const requestPayload: TContactPayload = JSON.parse(response.request().postData() ?? '{}');
    const body = await response.json();
    if (!body.status) {
      throw new Error(`Request failed: ${JSON.stringify(body)}`);
    }
    return { id: body.data.id, requestPayload };
  }

  errorMessageIn(container: Locator): Locator {
    return container.getByRole('alert');
  }

  private buildFieldLocators(build: (container: Locator) => Locator): Record<ContactField, Locator> {
    return Object.fromEntries(
      Object.values(ContactField).map((field) => [field, build(this.fieldContainer(field))])
    ) as Record<ContactField, Locator>;
  }

  // aria-label on these inputs is a broken i18n key ("$t:inputField"), so we key off the
  // visible label text instead — each field is `<div class="relative">` wrapping a label + input.
  private fieldContainer(field: ContactField): Locator {
    return this.page.locator('div.relative').filter({ has: this.page.getByText(field, { exact: true }) });
  }

  // The decorative checkbox overlay intercepts pointer events, so force is required.
  private async setCheckbox(checkbox: Locator, checked: boolean): Promise<void> {
    if (checked) {
      await checkbox.check({ force: true });
    } else {
      await checkbox.uncheck({ force: true });
    }
  }
}
