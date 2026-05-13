export function formatMoney(amount: number): string {
  const yuan = amount / 100;
  return `¥${yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function signedMoney(amount: number): string {
  const sign = amount > 0 ? '+' : '';
  return `${sign}${formatMoney(amount)}`;
}

