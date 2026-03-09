"use client";

const DPD_RED = "#DC0032";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = { sm: 32, md: 48, lg: 64 };

export function DpdLogo({ className = "", size = "md" }: Props) {
  const w = sizes[size];
  const h = Math.round(w * 0.4);

  return (
    <svg
      viewBox="0 0 80 32"
      width={w}
      height={h}
      className={className}
      aria-hidden
    >
      <text
        x="0"
        y="24"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="28"
        fill={DPD_RED}
      >
        DPD
      </text>
    </svg>
  );
}
