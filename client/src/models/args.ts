interface AppArgsInterface {
  port: string;
  p: string;
  url: string;
  u: string;
  dir: string;
  d: string;
  app: string;
  a: string;
}

export type AppArgs = Readonly<AppArgsInterface>;

export const getArgFor = (
  args: Partial<AppArgs>,
  arg: keyof AppArgs,
): string | undefined => {
  const longhand = args[arg];
  const shorthand = args[arg.charAt(0) as keyof AppArgs];
  return longhand || shorthand;
};
