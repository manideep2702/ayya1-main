"use client";

import React from "react";
import { AlertProvider } from "@/components/ui/alert-provider";
import AIChatbot from "@/components/chat/AIChatbot";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AlertProvider>
      {children}
      <AIChatbot />
    </AlertProvider>
  );
}

