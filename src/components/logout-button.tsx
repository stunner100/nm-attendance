"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [submitting, setSubmitting] = useState(false);

  const onClick = async () => {
    setSubmitting(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Button variant="outline" onClick={onClick} disabled={submitting}>
      {submitting ? "Signing out..." : "Sign out"}
    </Button>
  );
}
