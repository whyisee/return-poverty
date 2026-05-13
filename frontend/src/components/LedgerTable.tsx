import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { LedgerEntry } from '../types/game';
import { formatMoney, signedMoney } from '../utils/money';

interface LedgerTableProps {
  ledgers: LedgerEntry[];
}

export default function LedgerTable({ ledgers }: LedgerTableProps) {
  const columns: ColumnsType<LedgerEntry> = [
    {
      title: '日次',
      dataIndex: 'periodIndex',
      width: 72,
      render: value => `第 ${value} 天`,
    },
    {
      title: '流水',
      dataIndex: 'revenueAmount',
      render: value => formatMoney(value),
    },
    {
      title: '经营净现金流',
      dataIndex: 'operationNetCashFlow',
      render: value => <span className={value >= 0 ? 'money-up' : 'money-down'}>{signedMoney(value)}</span>,
    },
    {
      title: '家庭后净现金流',
      dataIndex: 'familyNetCashFlow',
      render: value => <Tag color={value >= 0 ? 'green' : 'red'}>{signedMoney(value)}</Tag>,
    },
  ];

  return (
    <Table
      className="ledger-table"
      columns={columns}
      dataSource={[...ledgers].reverse()}
      pagination={false}
      rowKey={item => `${item.periodType}-${item.periodIndex}`}
      scroll={{ x: 560 }}
      size="small"
    />
  );
}
