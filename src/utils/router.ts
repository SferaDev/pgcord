import { z, ZodIntersection } from 'zod';
import qs from 'qs';

type BaseSchema = z.ZodType<{}>;

type ProcedureResult<Response> = {
  statusCode: number;
  response: Response;
};

class Procedure<InputSchema extends BaseSchema> {
  constructor(
    public meta: {
      inputSchema: InputSchema;
      handler: (options: { input: z.input<InputSchema> }) => Promise<ProcedureResult<any>>;
    }
  ) {}

  input<T extends BaseSchema>(inputSchema: T) {
    return new Procedure<ZodIntersection<InputSchema, T>>({
      ...this.meta,
      inputSchema: z.intersection(this.meta.inputSchema, inputSchema)
    });
  }

  handler<T extends ProcedureResult<any>>(handler: (options: { input: z.infer<InputSchema> }) => Promise<T>) {
    return new Procedure<InputSchema>({ ...this.meta, handler });
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ProcedureName = `${HttpMethod} ${string}` | (string & {});

class Router<RouterContext extends BaseSchema = BaseSchema, Routes extends Record<ProcedureName, Procedure<any>> = {}> {
  constructor(
    public meta: {
      routerContext: BaseSchema;
      handler: (options: { ctx: z.input<BaseSchema> }) => Record<ProcedureName, Procedure<any>>;
      errorHandler: (error: Error) => ProcedureResult<any>;
    }
  ) {}

  input<T extends BaseSchema>(routerContext: T) {
    return new Router<T, Routes>({
      ...this.meta,
      routerContext: z.intersection(this.meta.routerContext, routerContext)
    });
  }

  build<T extends Record<ProcedureName, Procedure<any>>>(handler: (options: { ctx: z.input<RouterContext> }) => T) {
    return new Router<RouterContext, T>({ ...this.meta, handler });
  }

  onError(errorHandler: (error: Error) => ProcedureResult<any>) {
    return new Router<RouterContext, Routes>({
      ...this.meta,
      errorHandler
    });
  }

  async execute<T extends keyof Routes>(
    route: T,
    ctx: z.input<RouterContext>,
    params: T extends string ? z.input<Routes[T]['meta']['inputSchema']> : never
  ): Promise<ProcedureResult<any>> {
    try {
      const routes = this.meta.handler({ ctx });
      const { inputSchema, handler } = routes[route as string]?.meta;
      if (!handler) throw new Error(`Route ${route.toString()} not found`);

      const input = inputSchema.parse(params);
      return await handler({ input });
    } catch (error) {
      return this.meta.errorHandler(error);
    }
  }

  async match(ctx: z.input<RouterContext>, request: Request): Promise<ProcedureResult<any>> {
    const url = new URL(request.url);

    const routes = this.meta.handler({ ctx });
    const result = Object.entries(routes).reduce(
      (acc, [key, value]) => {
        if (acc) return acc;
        const [method, path] = key.split(' ');
        if (method.toUpperCase() !== request.method.toUpperCase()) return null;

        const regex = new RegExp(path.replace(/{([^}]+)}/g, (_, name) => `(?<${name}>[^/]+)`).replace(/\//g, '\\/'));
        const match = url.pathname.match(regex);
        if (match) {
          const pathParams = Object.fromEntries(
            Object.entries(match.groups ?? {}).map(([key, value]) => [key, value ?? ''])
          );
          return { name: key, procedure: value, pathParams };
        }

        return null;
      },
      null as MatchResult | null
    );
    if (!result) throw new Error(`Route ${request.method} ${url.pathname} not found`);

    const input = result.procedure.meta.inputSchema.parse({
      pathParams: result.pathParams,
      queryParams: qs.parse(url.search, { ignoreQueryPrefix: true })
    });

    return await result.procedure.meta.handler({ input });
  }
}

type MatchResult = { name: string; procedure: Procedure<any>; pathParams: Record<string, string> };

export const t = {
  get router() {
    return new Router({
      routerContext: z.object({}),
      handler: () => ({}),
      errorHandler: (error) => ({ statusCode: 500, response: { error: error.message } })
    });
  },
  get procedure() {
    return new Procedure({
      inputSchema: z.object({}),
      handler: async () => ({ statusCode: 200, response: {} })
    });
  }
};
