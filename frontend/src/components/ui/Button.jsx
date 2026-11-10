import { Link } from "react-router-dom";

export function Button({
  to,
  children,
  variant = "",
  className = "",
  ...props
}) {
  const cls = `button ${variant} ${className}`;
  return to ? (
    <Link className={cls} to={to} {...props}>
      {children}
    </Link>
  ) : (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
