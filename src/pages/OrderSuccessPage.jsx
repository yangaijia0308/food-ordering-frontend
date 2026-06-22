import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const { t } = useTranslation();

  return (
    <div className="order-success-page">
      <div className="order-success-page__card">
        <div className="order-success-page__icon">✓</div>
        <h1>{t('checkout.orderSuccess')}</h1>
        <p className="order-success-page__order-number">
          {t('checkout.orderNumber')}: <strong>#{id?.slice(-8).toUpperCase()}</strong>
        </p>
        <p className="order-success-page__delivery">
          Estimated delivery: 30-45 minutes
        </p>
        <Link to="/" className="btn btn--primary btn--large">
          {t('checkout.backToMenu')}
        </Link>
      </div>
    </div>
  );
}
