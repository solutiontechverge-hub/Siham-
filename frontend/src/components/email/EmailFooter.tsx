import * as React from "react";

type EmailFooterProps = {
  helpText?: string;
  companyLine?: string;
};

export default function EmailFooter({
  companyLine = "Mollure",
  helpText = "If you did not request this email, you can safely ignore it.",
}: EmailFooterProps) {
  return (
    <div
      style={{
        marginTop: "32px",
        paddingTop: "20px",
        borderTop: "1px solid #e7ecf4",
        fontSize: "13px",
        lineHeight: 1.6,
        color: "#6b7a90",
      }}
    >
      <div>{helpText}</div>
      <div style={{ marginTop: "8px" }}>{companyLine}</div>
    </div>
  );
}
