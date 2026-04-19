import './LavaLamp.css';

const ORBS = [
  { cls: 'o1', size: 560, color: 'rgba(40,40,42,0.5)' },
  { cls: 'o2', size: 420, color: 'rgba(20,20,22,0.6)' },
  { cls: 'o3', size: 480, color: 'rgba(60,62,65,0.4)' },
  { cls: 'o4', size: 340, color: 'rgba(80,82,86,0.35)' },
  { cls: 'o5', size: 390, color: 'rgba(15,15,17,0.55)' },
  { cls: 'o6', size: 300, color: 'rgba(50,52,55,0.3)' },
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
