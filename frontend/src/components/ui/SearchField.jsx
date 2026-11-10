import { Search } from "lucide-react";

export function SearchField({ value, onChange, placeholder = "Buscar…" }) {
  return (
    <label className="search-field">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
