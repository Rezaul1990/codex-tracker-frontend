"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { resetPassword } from "@/lib/authApi";

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const resetToken = String(formData.get("token") || "");
    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await resetPassword({ password, token: resetToken });
      setMessage(result.message || "Password reset successful.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm message={message} onSubmit={handleSubmit} title="Reset password">
      <label>
        Reset token
        <input
          name="token"
          required
          defaultValue={token}
          placeholder="Reset token"
        />
      </label>
      <label>
        New password
        <input
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters with a number"
        />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Reset password"}
      </button>
      <Link href="/auth/login">Back to login</Link>
    </AuthForm>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
