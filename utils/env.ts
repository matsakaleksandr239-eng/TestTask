export const ENV_KEYS = ['BASE_URL', 'LOGIN_EMAIL', 'LOGIN_PASSWORD'] as const;

type TRequired = (typeof ENV_KEYS)[number];
type TEnvVars = Record<TRequired, string>;

export function assertEnv(): void {
  const missing = ENV_KEYS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required env variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`
    );
  }
}

const ENV = process.env as unknown as TEnvVars;
export default ENV;
