interface MaterialIconProps {
  name: string;
  size?: number;
  fill?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function MaterialIcon({ name, size = 18, fill, style, className }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined${className ? ` ${className}` : ""}`}
      style={{
        fontSize: size,
        fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
        lineHeight: 1,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
