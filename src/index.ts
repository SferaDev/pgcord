import { z } from 'zod';
import { getRecord } from './operations/getRecord';
import { insertRecord } from './operations/insertRecord';
import { t } from './utils/router';
import { KyselySchema } from './utils/types';
import { queryTable } from './operations/query';

export const appRouter = t.router
  .input(
    z.object({
      db: KyselySchema,
      meta: z.object({ workspace: z.string(), region: z.string(), database: z.string(), branch: z.string() })
    })
  )
  .onError((error) => {
    if (error instanceof z.ZodError) {
      return { statusCode: 400, response: { error: error.errors.map((item) => item.message).join(', ') } };
    }

    return { statusCode: 500, response: { error: error.message } };
  })
  .build(({ ctx }) => ({
    'POST /tables/{table}/data': insertRecord(ctx),
    'GET /tables/{table}/data/{id}': getRecord(ctx),
    'POST /tables/{table}/query': queryTable(ctx)
  }));
