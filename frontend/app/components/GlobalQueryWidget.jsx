"use client";

import React from "react";
import { usePathname } from "next/navigation";
import UserQueryModal from "./UserQueryModal";

export default function GlobalQueryWidget() {
  const pathname = usePathname();

  if (!pathname || !pathname.startsWith("/profile")) {
    return null;
  }

  return <UserQueryModal />;
}
