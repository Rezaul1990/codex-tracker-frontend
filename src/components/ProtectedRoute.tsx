"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import type { UserRole } from "@/types/auth";
import styles from "@/app/page.module.css";

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
  children: ReactNode;
};

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (status === "authenticated" && allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace("/forbidden");
    }
  }, [allowedRoles, router, status, user]);

  if (status === "loading") {
    return <main className={styles.page}>Loading...</main>;
  }

  if (status === "unauthenticated") {
    return <main className={styles.page}>Redirecting...</main>;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <main className={styles.page}>Redirecting...</main>;
  }

  return <>{children}</>;
}
