import { Kysely } from 'kysely';
import { z } from 'zod';

export type OperationContext = {
  db: Kysely<Record<string, any>>;
  meta: { workspace: string; database: string; branch: string; region: string };
};

export const KyselySchema = z.instanceof(Kysely<Record<string, any>>);
