interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  variant?: "full" | "icon"
}

const sizes = {
  sm: { icon: 24, text: "text-sm" },
  md: { icon: 32, text: "text-lg" },
  lg: { icon: 40, text: "text-xl" },
  xl: { icon: 56, text: "text-2xl" },
}

export function Logo({ 
  className = "", 
  size = "md", 
  showText = true,
  variant = "full" 
}: LogoProps) {
  const { icon: iconSize, text: textSize } = sizes[size]
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Mark - Neural Synapse with Blockchain Node */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Background hexagon - represents blockchain/Hedera */}
        <path
          d="M24 4L42.5 14V34L24 44L5.5 34V14L24 4Z"
          className="fill-primary/10 stroke-primary"
          strokeWidth="1.5"
        />
        
        {/* Inner glow */}
        <path
          d="M24 10L36 17V31L24 38L12 31V17L24 10Z"
          className="fill-primary/5"
        />
        
        {/* Central node - the "synapse" core */}
        <circle
          cx="24"
          cy="24"
          r="6"
          className="fill-primary"
        />
        <circle
          cx="24"
          cy="24"
          r="3"
          className="fill-primary-foreground"
        />
        
        {/* Neural connection nodes */}
        <circle cx="24" cy="12" r="2.5" className="fill-primary" />
        <circle cx="34" cy="18" r="2.5" className="fill-primary" />
        <circle cx="34" cy="30" r="2.5" className="fill-primary" />
        <circle cx="24" cy="36" r="2.5" className="fill-primary" />
        <circle cx="14" cy="30" r="2.5" className="fill-primary" />
        <circle cx="14" cy="18" r="2.5" className="fill-primary" />
        
        {/* Neural pathways - connections from center to outer nodes */}
        <line x1="24" y1="18" x2="24" y2="14.5" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="29" y1="21" x2="32" y2="19" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="29" y1="27" x2="32" y2="29" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="24" y1="30" x2="24" y2="33.5" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19" y1="27" x2="16" y2="29" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19" y1="21" x2="16" y2="19" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Pulse ring animation indicator */}
        <circle
          cx="24"
          cy="24"
          r="10"
          className="stroke-primary/40"
          strokeWidth="0.75"
          strokeDasharray="4 4"
        />
      </svg>
      
      {/* Wordmark */}
      {showText && variant === "full" && (
        <div className="flex flex-col">
          <span className={`font-semibold ${textSize} text-foreground tracking-tight leading-none`}>
            Synapse<span className="text-primary">Worth</span>
          </span>
          {size !== "sm" && (
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">
              Cognitive Ledger
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Icon-only version for favicons, small spaces
export function LogoIcon({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M24 4L42.5 14V34L24 44L5.5 34V14L24 4Z"
        className="fill-primary/10 stroke-primary"
        strokeWidth="1.5"
      />
      <path
        d="M24 10L36 17V31L24 38L12 31V17L24 10Z"
        className="fill-primary/5"
      />
      <circle cx="24" cy="24" r="6" className="fill-primary" />
      <circle cx="24" cy="24" r="3" className="fill-primary-foreground" />
      <circle cx="24" cy="12" r="2.5" className="fill-primary" />
      <circle cx="34" cy="18" r="2.5" className="fill-primary" />
      <circle cx="34" cy="30" r="2.5" className="fill-primary" />
      <circle cx="24" cy="36" r="2.5" className="fill-primary" />
      <circle cx="14" cy="30" r="2.5" className="fill-primary" />
      <circle cx="14" cy="18" r="2.5" className="fill-primary" />
      <line x1="24" y1="18" x2="24" y2="14.5" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="21" x2="32" y2="19" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="27" x2="32" y2="29" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="30" x2="24" y2="33.5" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="27" x2="16" y2="29" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="21" x2="16" y2="19" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="10" className="stroke-primary/40" strokeWidth="0.75" strokeDasharray="4 4" />
    </svg>
  )
}
