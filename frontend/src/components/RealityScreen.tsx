import { useEffect, useMemo, useState } from 'react';

import type { EventCard, SimulateResponse } from '../types/game';

interface RealityScreenProps {
  event?: EventCard;
  latest: SimulateResponse | null;
}

export default function RealityScreen({ event, latest }: RealityScreenProps) {
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);

  const pendingLogs = useMemo(() => {
    if (!event) {
      return ['现场状态：今日暂无突发事件。'];
    }
    return [`待处理事件：${event.title}`, event.content];
  }, [event]);

  useEffect(() => {
    if (!latest?.actionLogs.length) {
      setVisibleLogs([]);
      return;
    }

    setVisibleLogs([]);
    const timers = latest.actionLogs.map((log, index) =>
      window.setTimeout(() => {
        setVisibleLogs(items => [...items, log]);
      }, 220 * index),
    );

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [latest]);

  const logs = latest?.actionLogs.length ? visibleLogs : pendingLogs;

  return (
    <div className="reality-screen">
      <div className="reality-screen-head">
        <span>现实屏</span>
        <strong>{latest ? latest.eventResult.title : '待开店'}</strong>
      </div>
      <div className="reality-stream">
        {logs.map((line, index) => (
          <div className="reality-line" key={`${line}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{line}</p>
          </div>
        ))}
        {latest?.actionLogs.length && visibleLogs.length < latest.actionLogs.length ? (
          <div className="reality-line loading-line">
            <span>...</span>
            <p>现场反馈写入中</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
