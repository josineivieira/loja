export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

