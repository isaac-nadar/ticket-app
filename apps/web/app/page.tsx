"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 👇 1. Import the Multi-Dimensional UI components we built!
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      router.push("/boards");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 2. Removed bg-gray-50. Let globals.css handle the background entirely.
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* 3. Replaced the hardcoded card with Semantic Tokens and Structural Variables */}
      <div className="bg-card text-card-foreground p-8 rounded-ui border border-ui border-border shadow-ui w-full max-w-sm transition-all duration-300">
        <h1 className="text-2xl font-bold mb-6 text-center">Kanban Login</h1>

        {error && (
          // 4. Mapped red to our Destructive tokens
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            {/* 5. Used our themed Label */}
            <Label htmlFor="email">Email</Label>
            {/* 6. Used our themed Input */}
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* 7. Used our themed Button */}
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
