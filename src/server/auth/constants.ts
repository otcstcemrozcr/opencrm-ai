export const SESSION_COOKIE = "ocrm_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

export type SessionClaims = {
  sub: string; // user id
  orgId: string;
  role: "admin" | "manager" | "rep" | "viewer";
  sid: string; // server-side session id (for revocation)
};
