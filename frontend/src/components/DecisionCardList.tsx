import { CheckOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';

import type { DecisionCard } from '../types/game';
import { formatMoney } from '../utils/money';

interface DecisionCardListProps {
  decisions: DecisionCard[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function DecisionCardList({ decisions, selectedIds, onChange }: DecisionCardListProps) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(item => item !== id));
      return;
    }
    if (selectedIds.length >= 3) {
      onChange([...selectedIds.slice(1), id]);
      return;
    }
    onChange([...selectedIds, id]);
  };

  return (
    <div className="decision-list">
      {decisions.map(decision => {
        const selected = selectedIds.includes(decision.id);
        return (
          <button
            className={`decision-card ${selected ? 'selected' : ''}`}
            key={decision.id}
            type="button"
            onClick={() => toggle(decision.id)}
          >
            <span className="decision-card-head">
              <strong>{decision.title}</strong>
              {selected ? <CheckOutlined /> : null}
            </span>
            <span className="decision-desc">{decision.description}</span>
            <span className="decision-meta">
              {decision.cost.cash ? <Tag color="gold">现金 {formatMoney(decision.cost.cash)}</Tag> : null}
              {decision.cost.energy ? <Tag color="orange">体力 -{decision.cost.energy}</Tag> : null}
              {decision.risk.slice(0, 2).map(item => (
                <Tag key={item}>{item}</Tag>
              ))}
            </span>
            <span className="decision-insight">{decision.insight}</span>
          </button>
        );
      })}
      {decisions.length === 0 ? <Button disabled>当前阶段暂无可选决策</Button> : null}
    </div>
  );
}

