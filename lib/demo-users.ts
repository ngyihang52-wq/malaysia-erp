export interface DemoUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
}

export const DEMO_USERS: DemoUser[] = [
  { id: "user_1", email: "me@nexa.com", password: "1234", name: "Boss", role: "ADMIN" },
];
