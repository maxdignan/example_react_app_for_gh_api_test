interface AppArgsInterface {
  url: string;
  dir: string;
  app: string;
  skipCheck: boolean;
}

export type AppArgs = Readonly<AppArgsInterface>;
