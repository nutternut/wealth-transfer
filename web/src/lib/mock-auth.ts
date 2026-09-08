export const MOCK_AUTH_COOKIE = "wt_mock_session";
export const LOGIN_ENTER_KEY = "wt_login_enter";
export const LOGOUT_ENTER_KEY = "wt_logout_enter";

export const MOCK_USERS = [
  {
    username: "user_01",
    password: "user_01",
    displayName: "ผู้ใช้งานตระกูล",
    role: "Family Admin",
  },
] as const;

export type MockUser = (typeof MOCK_USERS)[number];

export function findMockUser(username: string, password: string) {
  const normalized = username.trim().toLowerCase();
  return (
    MOCK_USERS.find(
      (user) =>
        user.username.toLowerCase() === normalized &&
        user.password === password,
    ) ?? null
  );
}

export function isMockSessionValue(value: string | undefined | null) {
  if (!value) return false;
  return MOCK_USERS.some((user) => user.username === value);
}
