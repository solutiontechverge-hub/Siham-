import * as React from "react";

type EmailHeaderProps = {
  brand?: string;
  title: string;
  subtitle?: string;
};

export default function EmailHeader({
  brand = "Mollure",
  subtitle,
  title,
}: EmailHeaderProps) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#00a9b4",
          marginBottom: "12px",
        }}
      >
        {brand}
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: "#10233f",
          marginBottom: subtitle ? "12px" : 0,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div style={{ fontSize: "15px", lineHeight: 1.6, color: "#51627d" }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
