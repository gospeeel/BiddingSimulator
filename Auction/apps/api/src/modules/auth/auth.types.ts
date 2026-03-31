export type JwtUserPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
};

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResult = {
  refreshToken: string;
  user: SafeUser;
};
