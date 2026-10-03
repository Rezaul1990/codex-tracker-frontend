"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { verifyEmail } from "@/lib/authApi";

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState(token ? "Verifying email..." : "Verification token is missing.");

  useEffect(() => {
    if (!token) {
      return;
    }

    verifyEmail(token)
      .then(() => setMessage("Email verified. You can now log in."))
      .catch((error) =>
        setMessage(error instanceof Error ? error.message : "Could not verify email"),
      );
  }, [token]);

  return (
    <AuthForm message={message} onSubmit={(event) => event.preventDefault()} title="Verify email">
      <Link href="/auth/login">Go to login</Link>
    </AuthForm>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
