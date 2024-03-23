import { z } from 'zod';
import { StringArray } from '../schemas';
import { isObject } from '../utils/lang';
import { t } from '../utils/router';
import { OperationContext } from '../utils/types';

export const insertRecord = ({ db }: OperationContext) =>
  t.procedure
    .input(
      z.object({
        pathParams: z.object({ table: z.string() }),
        queryParams: z.object({ columns: StringArray.optional() }).optional(),
        body: z
          .unknown()
          .refine((input) => isObject(input), { message: 'Body must be an object' })
          .refine((input) => Object.keys(input).length > 0, { message: 'Body must not be empty' })
      })
    )
    .handler(async ({ input }) => {
      let statement = db.insertInto(input.pathParams.table).values(input.body);
      if (input.queryParams?.columns) {
        statement = statement.returning(input.queryParams.columns) as typeof statement;
      }

      const query = statement.compile();
      const { rows } = await db.executeQuery(query);
      return { statusCode: 201, response: rows[0] ?? {} };
    });
