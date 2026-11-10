export function ErrorMessage({ children }) {
  return children ? (
    <div className="error-message" role="alert">
      {children}
    </div>
  ) : null;
}
