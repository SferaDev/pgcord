import { z, ZodIntersection } from 'zod';

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

class Router<RouterContext extends BaseSchema = BaseSchema, Routes extends Record<string, Procedure<any>> = {}> {
  constructor(
    public meta: {
      routerContext: BaseSchema;
      handler: (options: { ctx: z.input<BaseSchema> }) => Record<string, Procedure<any>>;
      errorHandler: (error: Error) => ProcedureResult<any>;
    }
  ) {}

  input<T extends BaseSchema>(routerContext: T) {
    return new Router<T, Routes>({
      ...this.meta,
      routerContext: z.intersection(this.meta.routerContext, routerContext)
    });
  }

  build<T extends Record<string, Procedure<any>>>(handler: (options: { ctx: z.input<RouterContext> }) => T) {
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
    params: z.input<Routes[T]['meta']['inputSchema']>
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
}

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
