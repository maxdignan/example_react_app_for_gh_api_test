export interface UserInterface {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;

  static fromJSON(json: UserInterface): User {
    return new User(json);
  }

  constructor(data: UserInterface) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
  }

  public clone(props: Partial<UserInterface>): User {
    return User.fromJSON({
      ...this,
      ...props,
    });
  }
}
