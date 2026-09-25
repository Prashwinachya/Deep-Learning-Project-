import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Bike, 
  Bus, 
  Truck, 
  Clock, 
  ArrowDownRight, 
  ArrowUpRight 
} from 'lucide-react';
import type { DetectionEvent, VehicleType } from '../../types/traffic';

interface ActivityFeedProps {
  events: DetectionEvent[];
}

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 2) return 'Just now';
  if (seconds < 60) return `${seconds} sec ago`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m ago`;
}

const ICONS: Record<VehicleType, React.ReactNode> = {
  car: <Car size={14} />,
  motorcycle: <Bike size={14} />,
  bus: <Bus size={14} />,
  truck: <Truck size={14} />,
  bicycle: <Bike size={14} />,
};

const COLORS: Record<VehicleType, string> = {
  car: 'var(--color-car)',
  motorcycle: 'var(--color-motorcycle)',
  bus: 'var(--color-bus)',
  truck: 'var(--color-truck)',
  bicycle: '#22d3ee',
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events }) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    return e.type === filter;
  });

  return (
    <div className="activity-feed-card">
      <div className="feed-header">
        <div className="feed-title">
          <Clock size={15} style={{ color: 'var(--cyan-primary)' }} />
          <span>Recent Detections</span>
          <span className="badge badge-cyan" style={{ fontSize: 10 }}>
            {filteredEvents.length} Logs
          </span>
        </div>

        {/* Quick Filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'car', 'motorcycle', 'truck', 'bicycle'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                background: filter === type ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                border: filter === type ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
                color: filter === type ? 'var(--cyan-primary)' : 'var(--text-muted)',
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="feed-list-scroll">
        <AnimatePresence initial={false}>
          {filteredEvents.map((evt) => {
            const color = COLORS[evt.type];
            return (
              <motion.div
                key={evt.id}
                className="feed-item"
                initial={{ opacity: 0, x: -10, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="feed-item-left">
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: `${color}18`,
                      border: `1px solid ${color}35`,
                      color: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {ICONS[evt.type]}
                  </div>

                  <span className="feed-id-badge" style={{ color }}>
                    ID #{evt.trackId}
                  </span>

                  <span className="feed-class-name">
                    {evt.type === 'motorcycle' ? 'Bike' : evt.type}
                  </span>
                </div>

                <div className="feed-item-right">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 10.5 }}>
                    {evt.direction === 'inbound' ? (
                      <ArrowDownRight size={12} style={{ color: 'var(--cyan-primary)' }} />
                    ) : (
                      <ArrowUpRight size={12} style={{ color: 'var(--color-motorcycle)' }} />
                    )}
                    <span>{evt.speedKmH} km/h</span>
                  </div>

                  <span className="feed-conf-tag" style={{ color: 'var(--cyan-primary)', fontWeight: 600 }}>
                    {Math.round(evt.confidence * 100)}%
                  </span>

                  <span className="feed-time-tag">
                    {timeAgo(evt.timestamp)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredEvents.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No vehicle logs in selected category
          </div>
        )}
      </div>
    </div>
  );
};
