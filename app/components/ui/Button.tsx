import { cn } from "@/app/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 ease-out cursor-pointer rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-dark active:scale-[0.97] shadow-sm hover:shadow-md",
    secondary:
      "bg-secondary text-white hover:bg-secondary-light active:scale-[0.97] shadow-sm hover:shadow-md",
    outline:
      "border-2 border-border text-secondary hover:border-primary hover:text-primary active:scale-[0.97] bg-transparent",
    ghost:
      "text-secondary-500 hover:text-secondary hover:bg-secondary-100 active:scale-[0.97] bg-transparent",
    accent:
      "bg-accent text-white hover:bg-accent-dark active:scale-[0.97] shadow-sm hover:shadow-md",
  };

  const sizes = {
    sm: "text-sm px-4 py-2 h-9",
    md: "text-sm px-5 py-2.5 h-11",
    lg: "text-base px-7 py-3 h-13",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
