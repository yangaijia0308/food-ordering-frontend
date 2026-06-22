import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  function fetchOrders() {
    fetch(`${API_URL}/orders`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
      })
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  async function updateStatus(orderId, newStatus) {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setOrders((prev) =>
        prev.map((order) =>
          (order.id || order._id) === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      alert(err.message);
    }
  }

  const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

  function getStatusLabel(status) {
    return t(`orders.status.${status}`) || status;
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : i18n.language === 'es' ? 'es-ES' : 'en-US');
    } catch {
      return dateStr;
    }
  }

  if (loading) {
    return <div className="page-loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  return (
    <div className="admin-page">
      <h1>{t('nav.admin')}</h1>
      {orders.length === 0 ? (
        <p className="admin-page__empty">{t('orders.noOrders')}</p>
      ) : (
        <div className="admin-page__list">
          {orders.map((order) => {
            const orderId = order.id || order._id;
            return (
              <div key={orderId} className="admin-order-card">
                <div className="admin-order-card__header">
                  <span className="admin-order-card__id">#{orderId?.toString().slice(-8).toUpperCase()}</span>
                  <span className="admin-order-card__date">{formatDate(order.createdAt || order.date)}</span>
                </div>
                <div className="admin-order-card__body">
                  <div className="admin-order-card__info">
                    <p><strong>{order.customer?.name || 'N/A'}</strong></p>
                    <p>{order.customer?.phone || ''}</p>
                    <p>{order.customer?.address || ''}</p>
                  </div>
                  <div className="admin-order-card__items">
                    {order.items?.map((item, idx) => (
                      <span key={idx} className="admin-order-card__item">
                        {item.name?.en || item.name} x{item.quantity}
                      </span>
                    ))}
                  </div>
                  <div className="admin-order-card__footer">
                    <span className="admin-order-card__total">
                      {t('common.currency')}{(order.total / 100).toFixed(2)}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(orderId, e.target.value)}
                      className={`admin-order-card__status admin-order-card__status--${order.status}`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{getStatusLabel(s)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
