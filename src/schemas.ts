import { z } from 'zod';

export type Context = {
  routeParams: z.infer<typeof RouteParams>;
  pathParams: z.infer<typeof DBBranchParams>;
  headers: { Authorization: string };
};

export const RouteParams = z.object({
  host: z.string(),
  workspace: z.string(),
  region: z.string()
});

export const DBBranchParams = z.object({
  database: z.string(),
  branch: z.string()
});

export const StringArray = z.union([
  z.string().transform((input) =>
    input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  ),
  z.array(z.string())
]);

export const headers = z.object({
  Authorization: z.string()
});

export const RecordIdentifier = z.string().transform((input) => {
  const identifiers = input.split(',');
  return identifiers.map((identifier) => {
    const parts = identifier.split(':');
    if (parts.length === 1) {
      return { column: 'xata_id', id: parts[0] };
    } else if (parts.length === 2) {
      return { column: parts[0], id: parts[1] };
    } else {
      throw new Error('Invalid identifier');
    }
  });
});
