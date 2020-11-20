export interface UserModel {
  _id: string;
  name: string;
  email: string;
  password: string;
  active: boolean;
  created: Date;
  updated: Date;
  organization: number;
};
