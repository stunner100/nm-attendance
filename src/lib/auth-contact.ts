export function getAdminContactEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return null;
  }

  return email;
}
