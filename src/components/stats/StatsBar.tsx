import React from 'react';
import { StatCard } from './StatCard';
import { Car, Bike, Bus, Truck, Layers, Navigation } from 'lucide-react';
import type { VehicleCounts } from '../../types/traffic';

interface StatsBarProps {
  counts: VehicleCounts;
}

export const StatsBar: React.FC<StatsBarProps> = ({ counts }) => {
  const total = counts.total || 1;
  const carShare = Math.round((counts.car / total) * 100);
  const bikeShare = Math.round((counts.motorcycle / total) * 100);
  const busShare = Math.round((counts.bus / total) * 100);
  const truckShare = Math.round((counts.truck / total) * 100);
  const bicycleShare = Math.round(((counts.bicycle || 0) / total) * 100);

  return (
    <div className="stats-bar-grid">
      <StatCard
        title="Total Vehicles"
        value={counts.total}
        icon={<Layers size={18} />}
        color="var(--cyan-primary)"
        deltaText="Real-time audit count"
        isPrimary={true}
      />

      <StatCard
        title="Cars"
        value={counts.car}
        icon={<Car size={18} />}
        color="var(--color-car)"
        sharePercent={carShare}
        deltaText="Passenger flow"
      />

      <StatCard
        title="Motorcycles"
        value={counts.motorcycle}
        icon={<Bike size={18} />}
        color="var(--color-motorcycle)"
        sharePercent={bikeShare}
        deltaText="Two-wheeler lane"
      />

      <StatCard
        title="Buses"
        value={counts.bus}
        icon={<Bus size={18} />}
        color="var(--color-bus)"
        sharePercent={busShare}
        deltaText="Transit vehicles"
      />

      <StatCard
        title="Trucks"
        value={counts.truck}
        icon={<Truck size={18} />}
        color="var(--color-truck)"
        sharePercent={truckShare}
        deltaText="Heavy freight"
      />

      <StatCard
        title="Bicycles"
        value={counts.bicycle || 0}
        icon={<Navigation size={18} />}
        color="#22d3ee"
        sharePercent={bicycleShare}
        deltaText="Cycle lane"
      />
    </div>
  );
};
