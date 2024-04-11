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
            pagination: z
              .object({
                limit: z.number().optional(),
                offset: z.number().optional()
              })
              .optional(),
            columns: StringArray.optional()
          })
          .optional()
      })
    )
    .handler(async ({ input }) => {
      const { workspace, region, database, branch } = meta;
      const { table } = input.pathParams;
      const { filter, sort, pagination, columns } = input.body ?? {};

      const cursor = Cursor.from(
        compactRecord({ workspace, region, database, branch, table, filter, sort, pagination, columns })
      ).toString();

      let statement = db.selectFrom(input.pathParams.table);

      if (input.body?.columns) {
        statement = statement.select(input.body.columns);
      } else {
        statement = statement.selectAll();
      }

      if (pagination?.limit) {
        statement = statement.limit(pagination.limit);
      }

      if (pagination?.offset) {
        statement = statement.offset(pagination.offset);
      }

      const query = statement.compile();
      const { rows } = await db.executeQuery(query);

      return { statusCode: 200, response: { records: rows, meta: { cursor } }, query };
    });
