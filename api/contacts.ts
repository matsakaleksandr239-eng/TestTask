import { expect, test, type APIRequestContext } from '@playwright/test';
import { type TContactPayload } from '../factories/contact';

export type TVerifyCreationParams = {
  id: number;
  actualPayload: TContactPayload;
  expectedPayload: TContactPayload;
  expectedResponse: Record<string, unknown>;
};

export async function create(request: APIRequestContext, contact: TContactPayload): Promise<number> {
  return test.step('Create contact', async () => {
    const response = await request.post('/api/contacts/store', { data: contact });
    const body = await response.json();
    if (!body.status) {
      throw new Error(`Failed to create contact: ${JSON.stringify(body)}`);
    }
    return body.data.id;
  });
}

export async function remove(request: APIRequestContext, id: number): Promise<void> {
  return test.step('Remove contact', async () => {
    await request.delete(`/api/contacts/remove/${id}`);
  });
}

export async function update(request: APIRequestContext, id: number, contact: TContactPayload): Promise<void> {
  return test.step('Update contact', async () => {
    const response = await request.post('/api/contacts/store', { data: { ...contact, id } });
    const body = await response.json();
    if (!body.status) {
      throw new Error(`Failed to update contact: ${JSON.stringify(body)}`);
    }
  });
}

export async function verifyCreation(request: APIRequestContext, params: TVerifyCreationParams): Promise<void> {
  return test.step('Verify contact creation', async () => {
    expect(params.actualPayload).toEqual(params.expectedPayload);

    const response = await request.get(`/api/contacts/${params.id}`);
    const { data } = await response.json();
    expect(data.contact).toEqual(params.expectedResponse);
  });
}
