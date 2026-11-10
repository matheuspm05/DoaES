export function DonationArt({ compact = false }) {
  return (
    <svg
      className={`donation-art ${compact ? "compact" : ""}`}
      viewBox="0 0 500 400"
      aria-hidden="true"
    >
      <circle cx="280" cy="190" r="160" fill="#c8e8d6" />
      <circle cx="290" cy="190" r="128" fill="#ddf0e4" />
      <path d="M65 337h385" stroke="#b9d6c8" strokeWidth="2" />
      <path d="M310 185c-40-75 90-75 53 0l-27 33Z" fill="#0e826c" />
      <path d="m336 210 0 80" stroke="#176d56" strokeWidth="4" />
      <path
        d="M335 257c-55 4-51-39-51-39 43 0 51 39 51 39M338 280c53 3 51-39 51-39-40 0-51 39-51 39"
        fill="#76b89b"
      />
      <path d="m319 281-13 56h63l-12-56" fill="#e8b88a" />
      <rect x="91" y="221" width="177" height="115" rx="9" fill="#d8af7e" />
      <path d="M91 232h177v19H91z" fill="#c09868" />
      <path d="m90 221 25-33h142l12 33" fill="#edcea4" />
      <path d="m177 191 1 146" stroke="#e9c895" strokeWidth="20" />
      <path d="M178 265c-36-41-69 10 0 48 69-38 35-89 0-48" fill="#fffaf0" />
      <rect
        x="104"
        y="136"
        width="137"
        height="48"
        rx="9"
        fill="#93c4aa"
        transform="rotate(-8 104 136)"
      />
      <path
        d="m119 141 36-30 23 13 21-20 32 24"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="105" cy="89" r="24" fill="#fff" />
      <path
        d="m95 89 7 7 14-15"
        fill="none"
        stroke="#0e826c"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M402 119v20m-10-10h20M66 196v12m-6-6h12"
        stroke="#3c9577"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M231 64c-10-15-25 4 0 19 24-15 9-34 0-19" fill="#cf9e6a" />
    </svg>
  );
}
