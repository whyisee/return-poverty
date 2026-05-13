import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Descriptions, Result, Skeleton, Statistic, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { generateReport } from '../services/sessionApi';
import type { Report } from '../types/game';
import { formatMoney, signedMoney } from '../utils/money';

export default function ReportPage() {
  const { sessionId = '' } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    generateReport(sessionId)
      .then(setReport)
      .catch(error => message.error((error as Error).message));
  }, [sessionId]);

  if (!report) {
    return (
      <main className="app-page">
        <Skeleton active paragraph={{ rows: 8 }} />
      </main>
    );
  }

  return (
    <main className="app-page report-page">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
        重新开一局
      </Button>

      <section className="report-hero">
        <div className="report-stamp">
          <span>REPORT</span>
          <strong>{report.title}</strong>
        </div>
        <Result
          status={report.totalNetCashFlow >= 0 ? 'success' : 'warning'}
          title={report.title}
          subTitle={report.summary}
        />
      </section>

      <section className="report-stat-grid">
        <div className="metric-tile">
          <Statistic title="总流水" value={formatMoney(report.totalRevenue)} />
        </div>
        <div className="metric-tile">
          <Statistic
            title="累计家庭后净现金流"
            value={signedMoney(report.totalNetCashFlow)}
            valueStyle={{ color: report.totalNetCashFlow >= 0 ? '#256f5d' : '#b42318' }}
          />
        </div>
        <div className="metric-tile">
          <Statistic title="最终现金" value={formatMoney(Number(report.reportDetail.finalCash || 0))} />
        </div>
        <div className="metric-tile">
          <Statistic title="可撑天数" value={`${report.reportDetail.survivalDays || 0} 天`} />
        </div>
      </section>

      <section className="report-detail-grid">
        <div className="report-box">
          <h2>最大压力来源</h2>
          <div className="tag-row">
            {report.maxLossSources.map(item => (
              <Tag color="red" key={item}>
                {item}
              </Tag>
            ))}
          </div>
        </div>
        <div className="report-box">
          <h2>做对的决策</h2>
          <div className="tag-row">
            {report.rightDecisions.map(item => (
              <Tag color="green" key={item}>
                {item}
              </Tag>
            ))}
          </div>
        </div>
        <div className="report-box">
          <h2>危险决策</h2>
          <div className="tag-row">
            {report.dangerousDecisions.map(item => (
              <Tag color="orange" key={item}>
                {item}
              </Tag>
            ))}
          </div>
        </div>
        <div className="report-box">
          <h2>系统建议</h2>
          <p>{report.suggestion}</p>
        </div>
      </section>

      <Descriptions bordered column={1} title="创业体检快照">
        <Descriptions.Item label="角色">{report.reportDetail.roleName}</Descriptions.Item>
        <Descriptions.Item label="赛道">{report.reportDetail.trackName}</Descriptions.Item>
        <Descriptions.Item label="最终债务">{formatMoney(Number(report.reportDetail.finalDebt || 0))}</Descriptions.Item>
        <Descriptions.Item label="家庭压力">{report.reportDetail.familyPressure}</Descriptions.Item>
      </Descriptions>

      <section className="share-box">
        <h2>分享文案</h2>
        <p>{report.shareText}</p>
      </section>
    </main>
  );
}
