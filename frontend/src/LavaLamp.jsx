import './LavaLamp.css';

const ORBS = [
  { cls: 'o1', size: 560, color: 'rgba(29,78,216,0.38)' },
  { cls: 'o2', size: 420, color: 'rgba(7,13,23,0.55)' },
  { cls: 'o3', size: 480, color: 'rgba(37,99,235,0.28)' },
  { cls: 'o4', size: 340, color: 'rgba(71,85,105,0.32)' },
  { cls: 'o5', size: 390, color: 'rgba(15,28,54,0.48)' },
  { cls: 'o6', size: 300, color: 'rgba(59,130,246,0.2)' },
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
