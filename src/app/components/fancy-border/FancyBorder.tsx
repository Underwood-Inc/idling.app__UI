import './FancyBorder.css';

export default function FancyBorder({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="fancy-border">{children}</div>;
}
