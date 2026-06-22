import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();

  function getItemName(item) {
    return item.name?.[i18n.language] || item.name?.en || item.name || '';
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page cart-page--empty">
        <h1>{t('cart.yourCart')}</h1>
        <p className="cart-page__empty-text">{t('cart.empty')}</p>
        <Link to="/" className="btn btn--primary">{t('cart.continueShopping')}</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>{t('cart.yourCart')}</h1>
      <div className="cart-page__items">
        {cart.map((item) => (
          <div key={item.id} className="cart-item">
            <img
              src={item.image || 'https://placehold.co/100x100/1a1a1a/e8c547?text=Food'}
              alt={getItemName(item)}
              className="cart-item__image"
            />
            <div className="cart-item__info">
              <h3 className="cart-item__name">{getItemName(item)}</h3>
              <span className="cart-item__price">
                {t('common.currency')}{(item.price / 100).toFixed(2)}
              </span>
            </div>
            <div className="cart-item__controls">
              <button
                className="cart-item__qty-btn"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
              >
                −
              </button>
              <span className="cart-item__qty">{item.quantity}</span>
              <button
                className="cart-item__qty-btn"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
            <div className="cart-item__subtotal">
              {t('common.currency')}{(item.price * item.quantity / 100).toFixed(2)}
            </div>
            <button
              className="cart-item__remove"
              onClick={() => removeFromCart(item.id)}
            >
              {t('cart.remove')}
            </button>
          </div>
        ))}
      </div>
      <div className="cart-page__summary">
        <div className="cart-page__total">
          <span>{t('cart.total')}</span>
          <span>{t('common.currency')}{(getCartTotal() / 100).toFixed(2)}</span>
        </div>
        <Link to="/checkout" className="btn btn--primary btn--large">
          {t('cart.checkout')}
        </Link>
        <Link to="/" className="btn btn--outline">{t('cart.continueShopping')}</Link>
      </div>
    </div>
  );
}
