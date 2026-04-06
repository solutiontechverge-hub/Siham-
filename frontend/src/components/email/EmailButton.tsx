import * as React from "react";

type EmailButtonProps = {
  href: string;
  label: string;
};

export default function EmailButton({ href, label }: EmailButtonProps) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        padding: "14px 24px",
        borderRadius: "999px",
        background: "linear-gradient(135deg, #10233f 0%, #00a9b4 100%)",
        color: "#ffffff",
        textDecoration: "none",
        fontWeight: 700,
      }}
    >
      {label}
    </a>
  );
}
