import './LavaLamp.css';

const ORBS = [
  { cls: 'o1', size: 560, color: 'rgba(15, 40, 90, 0.45)' },
  { cls: 'o2', size: 420, color: 'rgba(8, 20, 55, 0.55)' },
  { cls: 'o3', size: 480, color: 'rgba(29, 78, 160, 0.3)' },
  { cls: 'o4', size: 340, color: 'rgba(100, 140, 180, 0.25)' },
  { cls: 'o5', size: 390, color: 'rgba(10, 30, 70, 0.5)' },
  { cls: 'o6', size: 300, color: 'rgba(50, 100, 160, 0.2)' },
];

export default function LavaLamp() {
  return (
    <div className="lava-wrap" aria-hidden="true">
      {ORBS.map(({ cls, size, color }) => (
        <div
          key={cls}
          className={`lava-orb ${cls}`}
          style={{ width: size, height: size, background: color }}
        />
      ))}
    </div>
  );
}
