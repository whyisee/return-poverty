import { Alert } from 'antd';

import type { RiskAlert } from '../types/game';

interface RiskAlertsProps {
  alerts: RiskAlert[];
}

export default function RiskAlerts({ alerts }: RiskAlertsProps) {
  if (!alerts.length) {
    return null;
  }

  return (
    <div className="risk-alerts">
      {alerts.map(alert => (
        <Alert
          key={alert.message}
          showIcon
          type={alert.level === 'danger' ? 'error' : alert.level}
          message={alert.message}
        />
      ))}
    </div>
  );
}

