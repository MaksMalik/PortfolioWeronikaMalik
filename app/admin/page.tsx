"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_EMAIL, firebaseAuth } from "@/lib/firebase/client";
import { useAdminEdit } from "@/components/admin/admin-edit-context";

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, authLoading } = useAdminEdit();
  
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect to home if already logged in as admin
  useEffect(() => {
    if (!authLoading && isAdmin) {
      router.push("/");
    }
  }, [isAdmin, authLoading, router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        loginEmail.trim(),
        loginPassword
      );

      if (credential.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(firebaseAuth);
        setAuthError("Zalogować może się tylko skonfigurowany adres administratora.");
        return;
      }

      router.push("/");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Logowanie nie powiodło się.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (authLoading || (isAdmin && !authLoading)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-porcelain px-4 text-ink">
        <div className="w-full max-w-md border border-ink/10 bg-white p-8 shadow-editorial text-center rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-ink" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-ink/40">
            Weryfikacja sesji...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-porcelain px-4 text-ink">
      <motion.form
        onSubmit={handleLogin}
        className="w-full max-w-md border border-ink/10 bg-white p-6 shadow-editorial sm:p-8 rounded-3xl"
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-ink/50 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do strony
        </Link>
        <h1 className="font-serif text-5xl leading-none text-ink">Logowanie</h1>
        <div className="mt-8 grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
              className="rounded-full"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-password">Hasło</Label>
            <Input
              id="admin-password"
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              required
              className="rounded-full"
            />
          </div>
          {authError && <p className="text-sm leading-6 text-red-700">{authError}</p>}
          <Button type="submit" disabled={isLoggingIn} className="w-full">
            {isLoggingIn ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </div>
      </motion.form>
    </main>
  );
}
