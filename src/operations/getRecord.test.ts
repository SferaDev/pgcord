import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { appRouter } from '../index';
import { setupTest } from '../utils/test';

const { hooks, workspace, region, apiKey, database, branch } = setupTest();

beforeAll(async () => {
  await hooks.beforeAll();

  await appRouter.execute(
    'POST /db/{database}:{branch}/tables/{table}/data',
    {
      routeParams: { host: 'xata.sh', workspace, region },
      pathParams: { database, branch },
      headers: { Authorization: `Bearer ${apiKey}` }
    },
    { pathParams: { table: 'users' }, body: { xata_id: '1', name: 'Alice', age: 30 } }
  );
});

afterAll(async () => {
  await hooks.afterAll();
});

describe('getRecord', () => {
  const getRecord = (table: string, id: string, columns: string[] | undefined) =>
    appRouter.execute(
      'GET /db/{database}:${branch}/tables/{table}/data/{id}',
      {
        routeParams: { host: 'xata.sh', workspace, region },
        pathParams: { database, branch },
        headers: { Authorization: `Bearer ${apiKey}` }
      },
      { pathParams: { table, id, columns } }
    );

  test('gets a record', async () => {
    const { statusCode, response } = await getRecord('users', '1', undefined);
    expect(statusCode).toBe(200);
    expect(response['xata_id']).toBe('1');
    expect(response['name']).toBe('Alice');
  });
});
