import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  /** Compact version for tight spaces like nav triggers */
  compact?: boolean;
}

/**
 * Central LearnStocks logo component.
 *
 * Expects the actual logo assets to be available in public/ as:
 * - /logo-learnstocks-full.png  (horizontal logo with text)
 * - /logo-learnstocks-icon.png  (icon-only variant, used when compact=true)
 */
const BrandLogo = ({ className, compact = false }: BrandLogoProps) => {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <img
          src="/logo-learnstocks-icon.png"
          alt="LearnStocks logo"
          className="h-7 w-7 object-contain"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img
        src="/logo-learnstocks-full.png"
        alt="LearnStocks"
        className="h-16 object-contain max-w-full"
      />
    </div>
  );
};

export default BrandLogo;
