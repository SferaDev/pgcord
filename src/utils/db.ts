import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

type ClientOptions = {
  host: string;
  workspace: string;
  region: string;
  database: string;
  branch: string;
  apiKey: string;
};

export const getClient = ({ host, workspace, region, database, branch, apiKey }: ClientOptions) => {
  const dialect = new PostgresDialect({
    pool: new Pool({
      host: `${region}.sql.${host}`,
      database: `${database}:${branch}`,
      user: workspace.split('-').at(-1),
      password: apiKey,
      port: 5432,
      max: 1,
      ssl: true
    })
  });

  return new Kysely<Record<string, any>>({ dialect });
};
