export class AuthError extends Error {
  constructor() {
    super('Email address or password is incorrect.');
  }
}

export class ParamsError extends Error {
  constructor() {
    super('Invalid params.');
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found.');
  }
}
