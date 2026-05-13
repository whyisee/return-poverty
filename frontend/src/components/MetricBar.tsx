import { QuestionCircleOutlined } from '@ant-design/icons';
import { Progress, Tooltip } from 'antd';

import type { GameMetrics } from '../types/game';
import { formatMoney, signedMoney } from '../utils/money';

export type MetricKey = keyof GameMetrics;
export type MetricChanges = Partial<Record<MetricKey, number>>;
export type MetricHistory = Partial<Record<MetricKey, string[]>>;

interface MetricBarProps {
  metrics: GameMetrics;
  changes?: MetricChanges;
  history?: MetricHistory;
}

interface MetricItem {
  key: MetricKey;
  label: string;
  description: string;
  value: string;
  rawValue?: number;
  tone?: 'money' | 'good' | 'bad' | 'neutral';
  formatter: (value: number) => string;
  progress?: boolean;
}

const metricDescriptions: Record<MetricKey, string> = {
  cash: '当前能自由支配的现金。它决定你还能撑多久，以及有没有资格继续试错。',
  debt: '已经背上的债务。债务越高，每天的还款压力越明显。',
  dailyNetCashFlow: '当天扣除经营成本、家庭支出和还款之后，账上真实多了还是少了多少钱。',
  weeklyNetCashFlow: '按当前经营状态折算的一周现金流，用来判断趋势。',
  survivalDays: '按当前现金和现金缺口估算还能撑多少天。越低越接近止损线。',
  familyPressure: '家庭固定支出、债务、体力透支和沟通压力的综合值。',
  energy: '店主和家庭可承受的精力。过低会放大出错和家庭事件。',
  reputation: '口碑会影响自然客流、复购和差评后果。',
  repeatRate: '老客愿意再来的比例。复购比一次性满减更能撑住现金流。',
  information: '你对真实成本、合同、客流和账本的掌握程度。',
  impulse: '被爆单、加盟话术、沉没成本刺激后继续加码的倾向。',
};

function formatPercentRate(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatMetricDelta(key: MetricKey, delta: number) {
  if (key === 'cash' || key === 'debt' || key === 'dailyNetCashFlow' || key === 'weeklyNetCashFlow') {
    return signedMoney(delta);
  }
  if (key === 'repeatRate') {
    const value = Math.round(delta * 100);
    return `${value > 0 ? '+' : ''}${value}%`;
  }
  if (key === 'survivalDays') {
    return `${delta > 0 ? '+' : ''}${Math.round(delta)}天`;
  }
  return `${delta > 0 ? '+' : ''}${Math.round(delta)}`;
}

function metricDeltaTone(key: MetricKey, delta?: number) {
  if (!delta) {
    return 'flat';
  }
  const lowerIsBetter: MetricKey[] = ['debt', 'familyPressure', 'impulse'];
  const isGood = lowerIsBetter.includes(key) ? delta < 0 : delta > 0;
  return isGood ? 'good' : 'bad';
}

export default function MetricBar({ metrics, changes = {}, history = {} }: MetricBarProps) {
  const items: MetricItem[] = [
    {
      key: 'cash',
      label: '现金',
      description: metricDescriptions.cash,
      value: formatMoney(metrics.cash),
      formatter: formatMoney,
      tone: 'money',
    },
    {
      key: 'debt',
      label: '债务',
      description: metricDescriptions.debt,
      value: formatMoney(metrics.debt),
      formatter: formatMoney,
      tone: metrics.debt > 0 ? 'bad' : 'neutral',
    },
    {
      key: 'dailyNetCashFlow',
      label: '今日净流',
      description: metricDescriptions.dailyNetCashFlow,
      value: signedMoney(metrics.dailyNetCashFlow),
      formatter: signedMoney,
      tone: metrics.dailyNetCashFlow >= 0 ? 'good' : 'bad',
    },
    {
      key: 'weeklyNetCashFlow',
      label: '周趋势',
      description: metricDescriptions.weeklyNetCashFlow,
      value: signedMoney(metrics.weeklyNetCashFlow),
      formatter: signedMoney,
      tone: metrics.weeklyNetCashFlow >= 0 ? 'good' : 'bad',
    },
    {
      key: 'survivalDays',
      label: '可撑天数',
      description: metricDescriptions.survivalDays,
      value: metrics.survivalDays > 999 ? '稳定' : `${metrics.survivalDays} 天`,
      formatter: value => `${Math.round(value)}天`,
      tone: metrics.survivalDays > 30 ? 'good' : 'bad',
    },
    {
      key: 'familyPressure',
      label: '家庭压力',
      description: metricDescriptions.familyPressure,
      value: `${metrics.familyPressure}`,
      rawValue: metrics.familyPressure,
      formatter: value => `${Math.round(value)}`,
      progress: true,
      tone: metrics.familyPressure > 80 ? 'bad' : 'neutral',
    },
    {
      key: 'energy',
      label: '体力',
      description: metricDescriptions.energy,
      value: `${metrics.energy}`,
      rawValue: metrics.energy,
      formatter: value => `${Math.round(value)}`,
      progress: true,
      tone: metrics.energy > 40 ? 'good' : 'bad',
    },
    {
      key: 'reputation',
      label: '口碑',
      description: metricDescriptions.reputation,
      value: `${metrics.reputation}`,
      rawValue: metrics.reputation,
      formatter: value => `${Math.round(value)}`,
      progress: true,
      tone: metrics.reputation >= 50 ? 'good' : 'bad',
    },
    {
      key: 'repeatRate',
      label: '复购',
      description: metricDescriptions.repeatRate,
      value: formatPercentRate(metrics.repeatRate),
      rawValue: metrics.repeatRate * 100,
      formatter: formatPercentRate,
      progress: true,
      tone: 'good',
    },
    {
      key: 'information',
      label: '信息',
      description: metricDescriptions.information,
      value: `${metrics.information}`,
      rawValue: metrics.information,
      formatter: value => `${Math.round(value)}`,
      progress: true,
      tone: 'neutral',
    },
    {
      key: 'impulse',
      label: '冲动',
      description: metricDescriptions.impulse,
      value: `${metrics.impulse}`,
      rawValue: metrics.impulse,
      formatter: value => `${Math.round(value)}`,
      progress: true,
      tone: metrics.impulse > 70 ? 'bad' : 'neutral',
    },
  ];

  return (
    <section className="metric-sidebar" aria-label="核心指标">
      <div className="metric-sidebar-head">
        <span className="eyebrow">状态栏</span>
        <h2>经营指标</h2>
      </div>
      {items.map(item => {
        const delta = changes[item.key];
        const records = history[item.key] || [];
        const tooltip = (
          <div className="metric-tooltip">
            <p>{item.description}</p>
            <strong>变化记录</strong>
            {records.length ? (
              <ul>
                {records.slice(-4).map(record => (
                  <li key={record}>{record}</li>
                ))}
              </ul>
            ) : (
              <span>暂未发生变化</span>
            )}
          </div>
        );
        return (
          <div className={`metric-row ${item.tone || 'neutral'}`} key={item.key}>
            <div className="metric-row-main">
              <div className="metric-row-title">
                <span>{item.label}</span>
                <Tooltip title={tooltip} placement="right">
                  <QuestionCircleOutlined />
                </Tooltip>
              </div>
              <strong>{item.value}</strong>
            </div>
            <span className={`metric-delta ${metricDeltaTone(item.key, delta)}`}>
              {delta ? formatMetricDelta(item.key, delta) : '0'}
            </span>
            {item.progress ? (
              <Progress
                percent={Math.max(0, Math.min(100, Math.round(item.rawValue || 0)))}
                showInfo={false}
                size="small"
                strokeColor={item.tone === 'bad' ? '#b42318' : item.tone === 'good' ? '#256f5d' : '#2f6fed'}
              />
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
