import './FancyBorder.css';

export default function FancyBorder({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`fancy-border${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
