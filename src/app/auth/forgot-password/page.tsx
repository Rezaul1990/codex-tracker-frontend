"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthForm } from "@/components/AuthForm";
import { forgotPassword } from "@/lib/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await forgotPassword(email);
      setMessage(result.message || "Check your email for reset instructions.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not request password reset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm message={message} onSubmit={handleSubmit} title="Forgot password">
      <label>
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset email"}
      </button>
      <Link href="/auth/login">Back to login</Link>
    </AuthForm>
  );
}
