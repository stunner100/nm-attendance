export const HR_EVE_PROXY_ISSUER = "https://nightmarkethr.vercel.app/eve-proxy";
export const HR_EVE_PROXY_AUDIENCE = "hr-admin-eve";

export function getHrEveProxyJwtConfig() {
  return {
    algorithm: "HS256" as const,
    issuer: HR_EVE_PROXY_ISSUER,
    audiences: [HR_EVE_PROXY_AUDIENCE] as const,
    secret: process.env.AUTH_SECRET?.trim() ?? "",
    claims: {
      role: ["admin"],
    },
  };
}
