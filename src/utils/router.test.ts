import { describe, expect, test } from 'vitest';
import { t } from './router';
import { z } from 'zod';

const router = t.router.build(() => ({
  'GET /': t.procedure.handler(async () => ({ statusCode: 200, response: { message: 'Hello, world!' } })),
  'POST /foo/{foo}/bar/{bar}': t.procedure
    .input(z.object({ pathParams: z.object({ foo: z.string(), bar: z.string() }) }))
    .handler(async ({ input: { pathParams } }) => ({ statusCode: 201, response: pathParams }))
}));

describe('match', () => {
  test('matches root route', async () => {
    const { statusCode, response } = await router.match({}, new Request('http://foo.bar.com'));

    expect(statusCode).toBe(200);
    expect(response).toEqual({ message: 'Hello, world!' });
  });

  test('matches route with path params', async () => {
    const { statusCode, response } = await router.match(
      {},
      new Request('http://foo.bar.com/foo/123/bar/456', { method: 'POST' })
    );

    expect(statusCode).toBe(201);
    expect(response).toEqual({ foo: '123', bar: '456' });
  });
});
