import * as React from "react";

type EmailTemplateLayoutProps = {
  previewText?: string;
  children: React.ReactNode;
};

export default function EmailTemplateLayout({
  children,
  previewText,
}: EmailTemplateLayoutProps) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          padding: "24px 0",
          backgroundColor: "#f5f7fb",
          fontFamily: "Arial, sans-serif",
          color: "#10233f",
        }}
      >
        {previewText ? (
          <div
            style={{
              display: "none",
              overflow: "hidden",
              lineHeight: "1px",
              opacity: 0,
              maxHeight: 0,
              maxWidth: 0,
            }}
          >
            {previewText}
          </div>
        ) : null}
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
          <tbody>
            <tr>
              <td align="center">
                <table
                  width="600"
                  cellPadding={0}
                  cellSpacing={0}
                  role="presentation"
                  style={{
                    width: "100%",
                    maxWidth: "600px",
                    backgroundColor: "#ffffff",
                    borderRadius: "24px",
                    padding: "32px",
                  }}
                >
                  <tbody>
                    <tr>
                      <td>{children}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
