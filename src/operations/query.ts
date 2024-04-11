import { z } from 'zod';
import { StringArray } from '../schemas';
import { Cursor } from '../utils/cursor';
import { compactRecord } from '../utils/lang';
import { t } from '../utils/router';
import { OperationContext } from '../utils/types';

export const queryTable = ({ db, meta }: OperationContext) =>
  t.procedure
    .input(
      z.object({
        pathParams: z.object({ table: z.string() }),
        queryParams: z.object({}).optional(),
        body: z
          .object({
            filter: z.object({}).optional(),
            sort: z.object({}).optional(),
            page: z.object({}).optional(),
            columns: StringArray.optional()
          })
          .optional()
      })
    )
    .handler(async ({ input }) => {
      const { workspace, region, database, branch } = meta;
      const { table } = input.pathParams;
      const { filter, sort, page, columns } = input.body ?? {};

      const options = compactRecord({ filter, sort, page, columns });
      const cursor = Cursor.from({ workspace, region, database, branch, table, ...options }).toString();

      let statement = db.selectFrom(input.pathParams.table);

      if (input.body?.columns) {
        statement = statement.select(input.body.columns);
      } else {
        statement = statement.selectAll();
      }

      const query = statement.compile();
      console.log(query);

      const { rows } = await db.executeQuery(query);

      return { statusCode: 200, response: { records: rows, meta: { page: { cursor } } }, query };
    });
