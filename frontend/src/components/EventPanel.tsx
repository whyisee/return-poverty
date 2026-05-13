import { Alert, Tag } from 'antd';

import type { EventCard } from '../types/game';

interface EventPanelProps {
  event?: EventCard;
  result?: {
    title: string;
    message: string;
  };
}

export default function EventPanel({ event, result }: EventPanelProps) {
  if (result) {
    return <Alert className="event-alert" type="success" showIcon message={result.title} description={result.message} />;
  }

  if (!event) {
    return <Alert className="event-alert" type="info" showIcon message="今日暂无突发事件" />;
  }

  return (
    <div className="event-panel">
      <div className="event-title-row">
        <strong>{event.title}</strong>
        <Tag color="blue">{event.category}</Tag>
      </div>
      <p>{event.content}</p>
    </div>
  );
}

