type MyOrdersTabsProps = {
  activeTab: 'pending' | 'active' | 'history';
  pendingCount: number;
  activeCount: number;
  historyCount: number;
  onChange: (tab: 'pending' | 'active' | 'history') => void;
};

export function MyOrdersTabs({ activeTab, pendingCount, activeCount, historyCount, onChange }: MyOrdersTabsProps) {
  const tabs = [
    { id: 'pending' as const, label: 'Menunggu Pembayaran', count: pendingCount },
    { id: 'active' as const, label: 'Siap Diambil', count: activeCount },
    { id: 'history' as const, label: 'Selesai', count: historyCount },
  ];

  return (
    <div className="my-orders-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`my-orders-tab${activeTab === tab.id ? ' is-active' : ''}`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}
