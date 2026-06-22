import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [menuData, setMenuData] = useState({ categories: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    else fetchMenu();
  }, [activeTab]);

  function fetchOrders() {
    setLoading(true);
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

  function fetchMenu() {
    setLoading(true);
    fetch(`${API_URL}/menu`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch menu');
        return res.json();
      })
      .then((data) => {
        setMenuData(data);
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

  async function updateMenuItem(id, updates) {
    try {
      const res = await fetch(`${API_URL}/menu/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update menu item');
      const updated = await res.json();
      setMenuData((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === id ? updated : item)),
      }));
      setEditingItem(null);
      setEditForm({});
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteMenuItem(id) {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      const res = await fetch(`${API_URL}/menu/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete menu item');
      setMenuData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      }));
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleAvailability(item) {
    await updateMenuItem(item.id, { available: !item.available });
  }

  function startEdit(item) {
    setEditingItem(item.id);
    setEditForm({
      price: item.price,
      name: { ...item.name },
      description: { ...item.description },
      image: item.image || '',
    });
  }

  function cancelEdit() {
    setEditingItem(null);
    setEditForm({});
  }

  function saveEdit(id) {
    updateMenuItem(id, {
      price: Number(editForm.price),
      name: editForm.name,
      description: editForm.description,
      image: editForm.image,
    });
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

  function getItemName(item) {
    return item.name?.[i18n.language] || item.name?.en || '';
  }

  function getCategoryName(catId) {
    const cat = menuData.categories.find((c) => c.id === catId);
    return cat?.name?.[i18n.language] || cat?.name?.en || catId;
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

      {/* Tab switcher */}
      <div className="admin-page__tabs">
        <button
          className={`admin-page__tab ${activeTab === 'orders' ? 'admin-page__tab--active' : ''}`}
          onClick={() => { setActiveTab('orders'); setLoading(true); setError(null); }}
        >
          {t('admin.ordersTab')}
        </button>
        <button
          className={`admin-page__tab ${activeTab === 'menu' ? 'admin-page__tab--active' : ''}`}
          onClick={() => { setActiveTab('menu'); setLoading(true); setError(null); }}
        >
          {t('admin.menuTab')}
        </button>
      </div>

      {/* ── Orders Tab ── */}
      {activeTab === 'orders' && (
        orders.length === 0 ? (
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
        )
      )}

      {/* ── Menu Management Tab ── */}
      {activeTab === 'menu' && (
        <div className="admin-menu">
          {menuData.categories.map((cat) => {
            const catItems = menuData.items.filter((item) => item.category === cat.id);
            return (
              <div key={cat.id} className="admin-menu__category">
                <h2 className="admin-menu__category-title">{getCategoryName(cat.id)}</h2>
                {catItems.length === 0 ? (
                  <p className="admin-menu__empty">{t('admin.noItems')}</p>
                ) : (
                  <div className="admin-menu__list">
                    {catItems.map((item) => (
                      <div key={item.id} className={`admin-menu-item ${!item.available ? 'admin-menu-item--unavailable' : ''}`}>
                        <div className="admin-menu-item__image">
                          <img src={item.image || 'https://placehold.co/80x80/1a1a1a/e8c547?text=Food'} alt={getItemName(item)} />
                        </div>
                        <div className="admin-menu-item__info">
                          <span className="admin-menu-item__name">{getItemName(item)}</span>
                          <span className="admin-menu-item__id">{item.id}</span>
                        </div>

                        {editingItem === item.id ? (
                          <div className="admin-menu-item__edit">
                            <div className="admin-menu-item__edit-row">
                              <label>{t('admin.priceLabel')}</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={editForm.price}
                                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                                className="form-input admin-menu-item__input"
                              />
                            </div>
                            <div className="admin-menu-item__edit-row">
                              <label>{t('admin.nameEn')}</label>
                              <input
                                type="text"
                                value={editForm.name?.en || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: { ...f.name, en: e.target.value } }))}
                                className="form-input admin-menu-item__input"
                              />
                            </div>
                            <div className="admin-menu-item__edit-row">
                              <label>{t('admin.nameZh')}</label>
                              <input
                                type="text"
                                value={editForm.name?.zh || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: { ...f.name, zh: e.target.value } }))}
                                className="form-input admin-menu-item__input"
                              />
                            </div>
                            <div className="admin-menu-item__edit-row">
                              <label>{t('admin.nameEs')}</label>
                              <input
                                type="text"
                                value={editForm.name?.es || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: { ...f.name, es: e.target.value } }))}
                                className="form-input admin-menu-item__input"
                              />
                            </div>
                            <div className="admin-menu-item__edit-row">
                              <label>{t('admin.imageUrl')}</label>
                              <input
                                type="text"
                                value={editForm.image}
                                onChange={(e) => setEditForm((f) => ({ ...f, image: e.target.value }))}
                                className="form-input admin-menu-item__input"
                              />
                            </div>
                            <div className="admin-menu-item__edit-actions">
                              <button className="btn btn--primary btn--sm" onClick={() => saveEdit(item.id)}>
                                {t('admin.save')}
                              </button>
                              <button className="btn btn--outline btn--sm" onClick={cancelEdit}>
                                {t('admin.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="admin-menu-item__actions">
                            <span className="admin-menu-item__price">
                              {t('common.currency')}{(item.price / 100).toFixed(2)}
                            </span>
                            <span className={`admin-menu-item__avail ${item.available ? 'admin-menu-item__avail--on' : 'admin-menu-item__avail--off'}`}>
                              {item.available ? t('admin.available') : t('admin.unavailable')}
                            </span>
                            <button
                              className={`btn btn--sm ${item.available ? 'btn--outline' : 'btn--primary'}`}
                              onClick={() => toggleAvailability(item)}
                            >
                              {item.available ? t('admin.setUnavailable') : t('admin.setAvailable')}
                            </button>
                            <button className="btn btn--outline btn--sm" onClick={() => startEdit(item)}>
                              {t('admin.edit')}
                            </button>
                            <button className="btn btn--danger btn--sm" onClick={() => deleteMenuItem(item.id)}>
                              {t('admin.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
