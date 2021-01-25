interface UserInterface {
  mail: string;
  first_name: string | null;
  last_name: string | null;
  id: number;
}

export type User = Readonly<UserInterface>;
