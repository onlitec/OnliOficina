// Tipos para ambiente Deno/Supabase Edge Functions

// Declaração global do Deno
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

// Tipos para serve function
export interface ServeHandler {
  (req: Request): Response | Promise<Response>;
}

export declare function serve(handler: ServeHandler): void;

// Tipos para Supabase
export interface SupabaseClient {
  auth: {
    admin: {
      createUser(options: {
        email: string;
        password: string;
        email_confirm?: boolean;
        user_metadata?: Record<string, any>;
      }): Promise<{ data: { user: { id: string; email: string } } | null; error: any }>;
      deleteUser(userId: string): Promise<{ error: any }>;
      listUsers(): Promise<{ data: { users: Array<{ email: string; id: string }> } | null; error: any }>;
    };
  };
  from(table: string): {
    select(columns?: string): {
      eq(column: string, value: any): {
        single(): Promise<{ data: any; error: any }>;
      };
    };
    insert(data: any): {
      select(): {
        single(): Promise<{ data: any; error: any }>;
      };
    };
    delete(): {
      eq(column: string, value: any): Promise<{ error: any }>;
    };
  };
}

export declare function createClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
    };
  }
): SupabaseClient;

// Tipos para CORS
export interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Allow-Methods': string;
}

export declare function handleCors(req: Request): Response;
export declare const corsHeaders: CorsHeaders;

export {};