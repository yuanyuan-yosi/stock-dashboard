interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}
