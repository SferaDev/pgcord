import { z } from 'zod';
import { RecordIdentifier, StringArray } from '../schemas';
import { t } from '../utils/router';
import { OperationContext } from '../utils/types';

export const getRecord = ({ db }: OperationContext) =>
  t.procedure
    .input(
      z.object({
        pathParams: z.object({ table: z.string(), id: RecordIdentifier }),
        queryParams: z.object({ columns: StringArray.optional() }).optional()
      })
    )
    .handler(async ({ input }) => {
      let statement = db.selectFrom(input.pathParams.table);

      for (const { column, id } of input.pathParams.id) {
        statement = statement.where(column, '=', id);
      }

      if (input.queryParams?.columns) {
        statement = statement.select(input.queryParams.columns);
      } else {
        statement = statement.selectAll();
      }

      const query = statement.compile();
      const { rows } = await db.executeQuery(query);
      return { statusCode: 200, response: rows[0] ?? {} };
    });
