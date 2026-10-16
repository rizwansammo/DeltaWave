// Shown only to signed-in staff while Next.js draft mode is on, so there is
// no doubt that the page is an unpublished draft. Styles are inline: the
// public stylesheet and the approved design are untouched.

const bar: React.CSSProperties = {
  position: "fixed",
  insetInline: 0,
  bottom: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  padding: "10px 16px",
  background: "#132B46",
  color: "#ffffff",
  font: "500 13px/1.4 Manrope, Arial, sans-serif",
  letterSpacing: "0.01em",
};

const exit: React.CSSProperties = {
  color: "#ffffff",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
};

export function PreviewBar() {
  return (
    <div style={bar} role="status" data-preview-bar>
      <span>Draft preview · not visible to visitors</span>
      <a style={exit} href="/api/preview/exit">
        Exit preview
      </a>
    </div>
  );
}
