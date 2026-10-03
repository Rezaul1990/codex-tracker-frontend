"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { acceptInvitation } from "@/lib/authApi";

function InvitePageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const invitationToken = String(formData.get("token") || "");
    setIsSubmitting(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      await acceptInvitation({ password, token: invitationToken });
      setMessage("Account created. You can log in with your email and password now.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not accept invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm message={message} onSubmit={handleSubmit} title="Accept invitation">
      {token ? <input type="hidden" name="token" value={token} /> : null}
      {!token ? (
        <label>
          Invitation token
          <input name="token" required placeholder="Invitation token" />
        </label>
      ) : null}
      <label>
        Password
        <input
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters with a number"
        />
      </label>
      <label>
        Confirm password
        <input
          required
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat your password"
        />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
      <Link href="/auth/login">Go to login</Link>
    </AuthForm>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InvitePageContent />
    </Suspense>
  );
}
