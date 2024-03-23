import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { appRouter } from '../index';
import { getClient } from '../utils/db';
import { setupTest } from '../utils/test';

const { hooks, workspace, region, apiKey, database, branch } = setupTest();

beforeAll(async () => {
  await hooks.beforeAll();
});

afterAll(async () => {
  await hooks.afterAll();
});

describe('insertRecord', () => {
  const insertRecord = (table: string, columns: string[] | undefined, body: Record<string, unknown>) =>
    appRouter.execute(
      'POST /tables/{table}/data',
      { db: getClient({ host: 'xata.sh', workspace, region, database, branch, apiKey }) },
      { pathParams: { table }, queryParams: { columns }, body }
    );

  test('inserts a record', async () => {
    const { statusCode, response } = await insertRecord('users', undefined, { name: 'Alice', age: 30 });
    expect(statusCode).toBe(201);
    expect(response).toEqual({});
  });

  test('inserts a record and returns specified columns', async () => {
    const { statusCode, response } = await insertRecord('users', ['name'], { name: 'Bob', age: 25 });
    expect(statusCode).toBe(201);
    expect(response).toEqual({ name: 'Bob' });
  });

  test('fails when body is not an object', async () => {
    const { statusCode, response } = await insertRecord('users', undefined, 'not an object' as any);
    expect(statusCode).toBe(400);
    expect(response).toEqual({ error: 'Body must be an object' });
  });
});
