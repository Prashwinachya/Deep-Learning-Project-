import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  sharePercent?: number;
  deltaText?: string;
  isPrimary?: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  sharePercent,
  deltaText = '+12.4% vs last hr',
  isPrimary = false,
}) => {
  return (
    <motion.div 
      className={`stat-card ${isPrimary ? 'glass-panel-glow' : ''}`}
      style={{ color }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="stat-card-accent-bar" style={{ background: color }} />
      
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div 
          className="stat-card-icon-bubble"
          style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
        >
          {icon}
        </div>
      </div>

      <div className="stat-card-body">
        <div className="stat-card-count">
          <AnimatedNumber value={value} />
        </div>

        {sharePercent !== undefined && (
          <div 
            className="badge" 
            style={{ 
              background: `${color}15`, 
              color, 
              border: `1px solid ${color}35`,
              fontFamily: 'var(--font-mono)' 
            }}
          >
            {sharePercent}%
          </div>
        )}
      </div>

      <div className="stat-card-meta" style={{ marginTop: 8 }}>
        <TrendingUp size={12} style={{ color: 'var(--color-success)' }} />
        <span>{deltaText}</span>
      </div>
    </motion.div>
  );
};
