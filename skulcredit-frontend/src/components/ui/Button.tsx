import React from "react";

type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#8B1C53] text-white hover:bg-[#7a1848] focus-visible:ring-[#8B1C53]",
  outline:
    "border border-[#8B1C53] text-[#8B1C53] bg-transparent hover:bg-[#f9f0f5] focus-visible:ring-[#8B1C53]",
  ghost:
    "text-[#8B1C53] bg-transparent hover:bg-[#f9f0f5] focus-visible:ring-[#8B1C53]",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  isLoading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...rest
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading…
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
