"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";

import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ClearAllDataPanelProps = {
  wipeAllowed: boolean;
  confirmPhrase: string;
};

export function ClearAllDataPanel({ wipeAllowed, confirmPhrase }: ClearAllDataPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const [typedPhrase, setTypedPhrase] = useState("");
  const phraseMatches = typedPhrase.trim() === confirmPhrase;

  const handleClearAll = async () => {
    if (!phraseMatches) {
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete ALL data (attendance, HR, recruitment, payroll, training, performance, compliance)? This cannot be undone."
      )
    ) {
      return;
    }

    setError(null);
    setIsClearing(true);

    try {
      const res = await fetch("/api/admin/clear-all-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPhrase: typedPhrase.trim() }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to clear data");
      }

      setTypedPhrase("");
      router.refresh();
    } catch (err) {
      console.error("Clear failed", err);
      setError(
        err instanceof Error ? err.message : "Failed to clear data. Please try again."
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-lg text-destructive">Danger zone</CardTitle>
        </div>
        <CardDescription>
          Permanently delete all operational data: attendance, HR, recruitment, payroll,
          training, performance, and compliance records. Admin accounts are preserved. This
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AdminFormAlert message={error} />

        {!wipeAllowed ? (
          <p className="text-sm text-muted-foreground">
            Data wipe is disabled in production. Set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">ALLOW_DATA_WIPE=true</code>{" "}
            to enable.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="clear-all-confirm"
              >
                Type{" "}
                <span className="font-mono text-destructive">{confirmPhrase}</span> to confirm
              </label>
              <Input
                id="clear-all-confirm"
                value={typedPhrase}
                onChange={(event) => setTypedPhrase(event.target.value)}
                placeholder={confirmPhrase}
                autoComplete="off"
                spellCheck={false}
                disabled={isClearing}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={handleClearAll}
              disabled={!phraseMatches || isClearing}
            >
              <Trash2 className="h-4 w-4" />
              {isClearing ? "Clearing…" : "Clear all data"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
