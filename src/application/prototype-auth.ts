export type PrototypeAuthUser = {
  userId: string;
  username: string;
  displayName: string;
  role: string;
};

export type PrototypeAuthSession = {
  token: string;
  user: PrototypeAuthUser;
};

export const prototypeDemoCredentials = {
  username: "demo",
  password: "sweetbook123!",
} as const;
