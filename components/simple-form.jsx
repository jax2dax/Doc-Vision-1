"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Demo form. `conversion` adds data-conversion="true" to the <form>
// so a tracking script can count its submissions as conversions.
export function SimpleForm({ title, description, conversion = false }) {
  const [sent, setSent] = useState(false);

  const attrs = conversion ? { "data-conversion": "true" } : {};

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h1 className="font-display text-2xl text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        {sent ? (
          <p className="mt-6 text-sm text-foreground">Thanks, your message was received.</p>
        ) : (
          <form
            {...attrs}
            className="mt-6 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" className="mt-2" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" className="mt-2" required />
            </div>
            <Button type="submit" size="lg">
              Submit
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
