import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Context } from '../schemas';

export const getClient = (ctx: Context) => {
  const dialect = new PostgresDialect({
    pool: new Pool({
      host: `${ctx.routeParams.region}.sql.${ctx.routeParams.host}`,
      database: `${ctx.pathParams.database}:${ctx.pathParams.branch}`,
      user: ctx.routeParams.workspace.split('-').at(-1),
      password: ctx.headers.Authorization.split(' ').at(-1),
      port: 5432,
      max: 1,
      ssl: true
    })
  });

  return new Kysely<Record<string, any>>({ dialect });
};
