import { z } from 'zod';
import { RecordIdentifier, StringArray } from '../schemas';
import { t } from '../utils/router';
import { OperationContext } from '../utils/types';

export const getRecord = ({ db }: OperationContext) =>
  t.procedure
    .input(
      z.object({
        pathParams: z.object({ table: z.string(), id: RecordIdentifier, columns: StringArray.optional() })
      })
    )
    .handler(async ({ input }) => {
      let statement = db.selectFrom(input.pathParams.table);

      for (const { column, id } of input.pathParams.id) {
        statement = statement.where(column, '=', id);
      }

      if (input.pathParams.columns) {
        statement = statement.select(input.pathParams.columns);
      } else {
        statement = statement.selectAll();
      }

      const query = statement.compile();
      const { rows } = await db.executeQuery(query);
      return { statusCode: 200, response: rows[0] ?? {} };
    });
