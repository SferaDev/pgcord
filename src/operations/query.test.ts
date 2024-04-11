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

describe('query', () => {
  const insertRecord = (table: string, columns: string[] | undefined, body: Record<string, unknown>) =>
    appRouter.execute(
      'POST /tables/{table}/data',
      {
        db: getClient({ host: 'xata.sh', workspace, region, database, branch, apiKey }),
        meta: { workspace, region, database, branch }
      },
      { pathParams: { table }, queryParams: { columns }, body }
    );

  const queryTable = (table: string, columns: string[] | undefined, body: Record<string, unknown>) =>
    appRouter.execute(
      'POST /tables/{table}/query',
      {
        db: getClient({ host: 'xata.sh', workspace, region, database, branch, apiKey }),
        meta: { workspace, region, database, branch }
      },
      { pathParams: { table }, queryParams: { columns }, body }
    );

  test('query table', async () => {
    await insertRecord('users', undefined, { name: 'Alice', age: 30 });
    await insertRecord('users', undefined, { name: 'Bob', age: 25 });
    await insertRecord('users', undefined, { name: 'Charlie', age: 35 });

    const { statusCode, response } = await queryTable('users', undefined, {});
    expect(statusCode).toBe(200);
    expect(response.records.length).toBe(3);
  });
});
