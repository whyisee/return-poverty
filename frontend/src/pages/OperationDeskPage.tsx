import { CalculatorOutlined, FileDoneOutlined } from '@ant-design/icons';
import { Button, Divider, Spin, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import DecisionCardList from '../components/DecisionCardList';
import LedgerTable from '../components/LedgerTable';
import MetricBar, { formatMetricDelta, type MetricChanges, type MetricHistory, type MetricKey } from '../components/MetricBar';
import RealityScreen from '../components/RealityScreen';
import RiskAlerts from '../components/RiskAlerts';
import { getAvailableDecisions, getLedgers, getSession, simulate } from '../services/sessionApi';
import type { AvailableDecisionsResponse, GameMetrics, GameSession, LedgerEntry, RiskAlert, SimulateResponse } from '../types/game';

const phaseNames: Record<string, string> = {
  opening: '开业冲刺',
  stable: '稳定经营',
  crisis: '危机与诱惑',
  report: '结局复盘',
};

const metricKeys: MetricKey[] = [
  'cash',
  'debt',
  'dailyNetCashFlow',
  'weeklyNetCashFlow',
  'survivalDays',
  'familyPressure',
  'energy',
  'reputation',
  'repeatRate',
  'information',
  'impulse',
];

function buildMetricChanges(before: GameMetrics, after: GameMetrics): MetricChanges {
  return metricKeys.reduce<MetricChanges>((changes, key) => {
    changes[key] = after[key] - before[key];
    return changes;
  }, {});
}

export default function OperationDeskPage() {
  const { sessionId = '' } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<GameSession | null>(null);
  const [available, setAvailable] = useState<AvailableDecisionsResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [latest, setLatest] = useState<SimulateResponse | null>(null);
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [metricChanges, setMetricChanges] = useState<MetricChanges>({});
  const [metricHistory, setMetricHistory] = useState<MetricHistory>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sessionData, availableData, ledgerData] = await Promise.all([
        getSession(sessionId),
        getAvailableDecisions(sessionId),
        getLedgers(sessionId),
      ]);
      setSession(sessionData);
      setAvailable(availableData);
      setLedgers(ledgerData);
      setSelectedIds([]);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sessionId]);

  const submit = async () => {
    if (!session) {
      message.warning('游戏局尚未加载完成');
      return;
    }
    if (!available?.event) {
      message.warning('当前没有可结算事件');
      return;
    }
    if (!selectedIds.length) {
      message.warning('至少选择一个经营动作');
      return;
    }
    setSubmitting(true);
    try {
      const beforeMetrics = session.metrics;
      const currentDay = session.day;
      const result = await simulate(sessionId, selectedIds, available.event.id);
      const changes = buildMetricChanges(beforeMetrics, result.session.metrics);
      setMetricChanges(changes);
      setMetricHistory(history => {
        const next: MetricHistory = { ...history };
        metricKeys.forEach(key => {
          const delta = changes[key] || 0;
          if (delta === 0) {
            return;
          }
          next[key] = [...(next[key] || []), `第 ${currentDay} 天：${formatMetricDelta(key, delta)}`];
        });
        return next;
      });
      setLatest(result);
      setSession(result.session);
      setAlerts(result.riskAlerts);
      const ledgerData = await getLedgers(sessionId);
      setLedgers(ledgerData);
      if (result.session.phase !== 'report') {
        const nextAvailable = await getAvailableDecisions(sessionId);
        setAvailable(nextAvailable);
      } else {
        setAvailable(null);
      }
      setSelectedIds([]);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session) {
    return (
      <main className="app-page">
        <Spin size="large" />
      </main>
    );
  }

  return (
    <main className="app-page desk-page">
      <header className="desk-header">
        <div>
          <span className="eyebrow">第 {session.day} 天</span>
          <h1>{phaseNames[session.phase] || session.phase}</h1>
        </div>
        <Button icon={<FileDoneOutlined />} onClick={() => navigate(`/report/${session.id}`)}>
          查看体检报告
        </Button>
      </header>

      <section className="desk-layout">
        <MetricBar metrics={session.metrics} changes={metricChanges} history={metricHistory} />

        <div className="main-workbench">
          {session.phase === 'report' ? (
            <div className="finish-panel">
              <h2>7 天快速体验已结束</h2>
              <p>账本已经够说明问题了，现在生成创业体检报告。</p>
              <Button icon={<FileDoneOutlined />} type="primary" onClick={() => navigate(`/report/${session.id}`)}>
                生成体检报告
              </Button>
            </div>
          ) : (
            <>
              <div className="section-title-row">
                <div>
                  <h2>今日经营动作</h2>
                  <span>最多选择 3 个</span>
                </div>
                <Button
                  className="settle-button"
                  disabled={!selectedIds.length}
                  icon={<CalculatorOutlined />}
                  loading={submitting}
                  size="large"
                  type="primary"
                  onClick={submit}
                >
                  结束今日试营
                </Button>
              </div>
              <DecisionCardList
                decisions={available?.decisions || []}
                selectedIds={selectedIds}
                onChange={setSelectedIds}
              />
              <div className="mobile-settle-spacer">
                <Button
                  className="settle-button mobile-settle-button"
                  disabled={!selectedIds.length}
                  icon={<CalculatorOutlined />}
                  loading={submitting}
                  size="large"
                  type="primary"
                  onClick={submit}
                >
                  结束今日试营
                </Button>
              </div>
            </>
          )}
          <Divider />
          <section className="operation-feedback" aria-label="今日反馈">
            <div className="feedback-event-card">
              <RealityScreen event={available?.event} latest={latest} />
            </div>
          </section>
        </div>

        <aside className="ledger-panel">
          <h2>账本</h2>
          <RiskAlerts alerts={alerts} />
          <LedgerTable ledgers={ledgers} />
        </aside>
      </section>
    </main>
  );
}
