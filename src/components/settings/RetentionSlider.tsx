interface RetentionSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color: string;
  onChange: (value: number) => void;
}

export default function RetentionSlider({
  label, value, min, max, unit, color, onChange,
}: RetentionSliderProps) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "6px",
      }}>
        <span style={{
          fontSize: "12px",
          color: "var(--color-text-secondary)",
          fontFamily: "var(--font-display)",
        }}>
          {label}
        </span>
        <span style={{
          fontSize: "12px",
          color,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
        }}>
          {value} {unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: color,
          cursor: "pointer",
          height: "3px",
        }}
      />
    </div>
  );
}
