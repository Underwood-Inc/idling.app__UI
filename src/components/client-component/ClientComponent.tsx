"use client";

import React, { ReactNode } from "react";

export default function ClientComponent({
  children,
}: {
  children?: ReactNode;
}): React.JSX.Element {
  return <div>{children}</div>;
}
