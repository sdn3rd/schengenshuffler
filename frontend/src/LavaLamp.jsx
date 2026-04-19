import './LavaLamp.css';

const ORBS = [
  { cls: 'o1', size: 560, color: 'rgba(8, 22, 60, 0.6)' },
  { cls: 'o2', size: 420, color: 'rgba(4, 12, 38, 0.7)' },
  { cls: 'o3', size: 480, color: 'rgba(15, 50, 120, 0.4)' },
  { cls: 'o4', size: 340, color: 'rgba(60, 100, 150, 0.3)' },
  { cls: 'o5', size: 390, color: 'rgba(6, 18, 52, 0.65)' },
  { cls: 'o6', size: 300, color: 'rgba(25, 65, 120, 0.3)' },
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
