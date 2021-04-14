interface OrganizationInterface {
  name: string;
  id: number;
}

export type Organization = Readonly<OrganizationInterface>;
