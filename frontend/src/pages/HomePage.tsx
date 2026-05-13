import { PlayCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Radio, Skeleton, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getBootstrap } from '../services/contentApi';
import { createSession } from '../services/sessionApi';
import type { BootstrapContent, GameMode } from '../types/game';
import { formatMoney } from '../utils/money';

export default function HomePage() {
  const [content, setContent] = useState<BootstrapContent | null>(null);
  const [roleId, setRoleId] = useState('');
  const [trackId, setTrackId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getBootstrap()
      .then(data => {
        setContent(data);
        setRoleId(data.roles[0]?.id || '');
        setTrackId(data.businessTracks[0]?.id || '');
        setPackageId(data.openingPackages[0]?.id || '');
      })
      .catch(error => message.error(error.message));
  }, []);

  const selectedRole = useMemo(() => content?.roles.find(item => item.id === roleId), [content, roleId]);
  const selectedTrack = useMemo(() => content?.businessTracks.find(item => item.id === trackId), [content, trackId]);
  const selectedPackage = useMemo(
    () => content?.openingPackages.find(item => item.id === packageId),
    [content, packageId],
  );

  const start = async (mode: GameMode) => {
    if (!roleId || !trackId || !packageId) {
      message.warning('请先完成角色、赛道和开局包选择');
      return;
    }
    setSubmitting(true);
    try {
      const session = await createSession({
        mode,
        roleId,
        businessTrackId: trackId,
        openingPackageId: packageId,
      });
      navigate(`/session/${session.id}`);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!content) {
    return (
      <main className="app-page">
        <Skeleton active paragraph={{ rows: 10 }} />
      </main>
    );
  }

  return (
    <main className="app-page home-page">
      <section className="home-layout">
        <div className="setup-panel">
          <div className="home-hero">
            <div className="title-block">
              <span className="eyebrow">经营模拟器 MVP</span>
              <h1>中年返贫四件套：小店生死账</h1>
              <p>先选人，再选店。第一版会带你跑完 7 天快速体验，重点看现金流、家庭压力和止损线。</p>
              <div className="hero-actions">
                <Button
                  icon={<PlayCircleOutlined />}
                  loading={submitting}
                  size="large"
                  type="primary"
                  onClick={() => start('quick')}
                >
                  开始 7 天试营
                </Button>
                <Button
                  className="secondary-start"
                  loading={submitting}
                  size="large"
                  onClick={() => start('full')}
                >
                  体验完整流程
                </Button>
                <span>先选角色、赛道和开局包，再进入对应体验。</span>
              </div>
            </div>
          </div>

          <div className="field-block">
            <span className="field-label">角色</span>
            <Radio.Group className="choice-grid" value={roleId} onChange={event => setRoleId(event.target.value)}>
              {content.roles.map(role => (
                <Radio.Button className="choice-card" key={role.id} value={role.id}>
                  <strong>{role.name}</strong>
                  <span>{role.description}</span>
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          <div className="field-block">
            <span className="field-label">赛道</span>
            <Radio.Group className="track-grid" value={trackId} onChange={event => setTrackId(event.target.value)}>
              {content.businessTracks.map(track => (
                <Radio.Button className="track-card" key={track.id} value={track.id}>
                  <strong>{track.name}</strong>
                  <span>{track.description}</span>
                  <span className="tag-row">
                    {track.risks.slice(0, 2).map(item => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                  </span>
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          <div className="field-block">
            <span className="field-label">开局包</span>
            <Radio.Group className="package-grid" value={packageId} onChange={event => setPackageId(event.target.value)}>
              {content.openingPackages.map(item => (
                <Radio.Button className="package-card" key={item.id} value={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        </div>

        <aside className="preview-panel">
          <div className="preview-heading">
            <span className="eyebrow">开局体检</span>
            <h2>{selectedTrack ? `${selectedTrack.name}店压力盘` : '开局体检'}</h2>
          </div>
          {selectedRole ? (
            <div className="preview-stack">
              <div className="cash-card">
                <span>开局可动用现金</span>
                <strong>{formatMoney(selectedRole.initialMetrics.cash + (selectedPackage?.effect.cash || 0))}</strong>
                <small>扣除开局包后，真正能拿来撑试错的钱。</small>
              </div>
              <div className="preview-row">
                <span>选择赛道</span>
                <strong>{selectedTrack?.name || '-'}</strong>
              </div>
              <div className="preview-row">
                <span>初始债务</span>
                <strong>{formatMoney(selectedRole.initialMetrics.debt)}</strong>
              </div>
              <div className="preview-row">
                <span>家庭压力</span>
                <strong>{selectedRole.initialMetrics.familyPressure}</strong>
              </div>
              <Alert
                showIcon
                type="warning"
                message="流水不是利润，第一局先盯住家庭后净现金流。"
              />
              {selectedTrack ? (
                <div>
                  <h3>赛道风险</h3>
                  <div className="tag-row">
                    {selectedTrack.risks.map(item => (
                      <Tag color="gold" key={item}>
                        {item}
                      </Tag>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <h3>优势</h3>
                <div className="tag-row">
                  {selectedRole.advantages.map(item => (
                    <Tag color="green" key={item}>
                      {item}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <h3>风险</h3>
                <div className="tag-row">
                  {selectedRole.risks.map(item => (
                    <Tag color="red" key={item}>
                      {item}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
