import { z } from 'zod';
import { getClient } from '../utils/db';
import { isObject } from '../utils/lang';
import { t } from '../utils/router';
import { StringArray, Context } from '../schemas';

export const insertRecord = (ctx: Context) =>
  t.procedure
    .input(
      z.object({
        pathParams: z.object({ table: z.string(), columns: StringArray.optional() }),
        body: z
          .unknown()
          .refine((input) => isObject(input), { message: 'Body must be an object' })
          .refine((input) => Object.keys(input).length > 0, { message: 'Body must not be empty' })
      })
    )
    .handler(async ({ input }) => {
      const db = getClient(ctx);
      let statement = db.insertInto(input.pathParams.table).values(input.body);
      if (input.pathParams.columns) {
        statement = statement.returning(input.pathParams.columns) as typeof statement;
      }

      const query = statement.compile();
      const { rows } = await db.executeQuery(query);
      return { statusCode: 201, response: rows[0] ?? {} };
    });
