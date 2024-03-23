import { z } from 'zod';
import { getRecord } from './operations/getRecord';
import { insertRecord } from './operations/insertRecord';
import { t } from './utils/router';
import { KyselySchema } from './utils/types';

export const appRouter = t.router
  .input(z.object({ db: KyselySchema }))
  .onError((error) => {
    if (error instanceof z.ZodError) {
      return { statusCode: 400, response: { error: error.errors.map((item) => item.message).join(', ') } };
    }

    return { statusCode: 500, response: { error: error.message } };
  })
  .build(({ ctx }) => ({
    'POST /db/{database}:{branch}/tables/{table}/data': insertRecord(ctx),
    'GET /db/{database}:${branch}/tables/{table}/data/{id}': getRecord(ctx)
  }));
