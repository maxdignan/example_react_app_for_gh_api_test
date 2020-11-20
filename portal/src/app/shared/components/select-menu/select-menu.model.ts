interface MenuOptionInterface {
  id?: string | number;
  name?: string | number;
  [key: string]: any;
}

export type MenuOption = Readonly<MenuOptionInterface>;
