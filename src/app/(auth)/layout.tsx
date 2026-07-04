// src/app/(auth)/masuk/layout.tsx
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-container bg-slate-50 min-h-screen">
      {children}
    </div>
  );
}