import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

export default function MenuPage() {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [addedItems, setAddedItems] = useState({});

  useEffect(() => {
    fetch(`${API_URL}/menu`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch menu');
        return res.json();
      })
      .then((data) => {
        const items = data.items || data || [];
        setMenuItems(items);
        if (items.length > 0) {
          const categories = [...new Set(items.map((item) => item.category))];
          setActiveCategory(categories[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const categories = [...new Set(menuItems.map((item) => item.category))];

  const categoryLabels = {
    appetizers: t('menu.appetizers'),
    mainCourses: t('menu.mainCourses'),
    drinks: t('menu.drinks'),
    desserts: t('menu.desserts'),
  };

  function handleAddToCart(item) {
    addToCart(item);
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);
  }

  function getItemName(item) {
    return item.name?.[i18n.language] || item.name?.en || item.name || '';
  }

  function getItemDescription(item) {
    return item.description?.[i18n.language] || item.description?.en || item.description || '';
  }

  if (loading) {
    return <div className="page-loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="page-error">{t('common.error')}</div>;
  }

  const filteredItems = activeCategory
    ? menuItems.filter((item) => item.category === activeCategory)
    : menuItems;

  return (
    <div className="menu-page">
      <h1 className="menu-page__title">{t('menu.ourMenu')}</h1>
      <div className="menu-page__categories">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`menu-page__category-btn ${activeCategory === cat ? 'menu-page__category-btn--active' : ''}`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>
      <div className="menu-page__grid">
        {filteredItems.map((item) => (
          <div key={item.id} className="menu-card">
            <div className="menu-card__image-wrap">
              <img
                src={item.image || 'https://placehold.co/400x300/1a1a1a/e8c547?text=Food'}
                alt={getItemName(item)}
                className="menu-card__image"
              />
            </div>
            <div className="menu-card__body">
              <h3 className="menu-card__name">{getItemName(item)}</h3>
              <p className="menu-card__desc">{getItemDescription(item)}</p>
              <div className="menu-card__footer">
                <span className="menu-card__price">
                  {t('common.currency')}{(item.price / 100).toFixed(2)}
                </span>
                <button
                  onClick={() => handleAddToCart(item)}
                  className={`menu-card__add-btn ${addedItems[item.id] ? 'menu-card__add-btn--added' : ''}`}
                >
                  {addedItems[item.id] ? t('menu.added') : t('menu.addToCart')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
