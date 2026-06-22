import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

let stripePromise = null;

function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');
  }
  return stripePromise;
}

function CheckoutForm({ clientSecret, customerInfo, setCustomerInfo }) {
  const { t } = useTranslation();
  const { cart, getCartTotal, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setCustomerInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const orderRes = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: customerInfo,
            items: cart.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            total: getCartTotal(),
            paymentIntentId: paymentIntent.id,
          }),
        });

        if (!orderRes.ok) throw new Error('Failed to create order');
        const orderData = await orderRes.json();
        clearCart();
        navigate(`/order-success/${orderData.id || orderData._id || paymentIntent.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-form__section">
        <h2>{t('checkout.title')}</h2>
        <div className="form-group">
          <label htmlFor="name">{t('checkout.name')}</label>
          <input
            id="name"
            name="name"
            type="text"
            value={customerInfo.name}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">{t('checkout.phone')}</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={customerInfo.phone}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="address">{t('checkout.address')}</label>
          <input
            id="address"
            name="address"
            type="text"
            value={customerInfo.address}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="notes">{t('checkout.notes')}</label>
          <textarea
            id="notes"
            name="notes"
            value={customerInfo.notes}
            onChange={handleChange}
            className="form-input"
            rows={3}
          />
        </div>
      </div>

      <div className="checkout-form__section">
        <h3>Order Summary</h3>
        <div className="checkout-summary">
          {cart.map((item) => (
            <div key={item.id} className="checkout-summary__item">
              <span>{item.name?.en || item.name} x{item.quantity}</span>
              <span>{t('common.currency')}{(item.price * item.quantity / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="checkout-summary__total">
            <span>{t('cart.total')}</span>
            <span>{t('common.currency')}{(getCartTotal() / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="checkout-form__section">
        <h3>{t('checkout.payNow')}</h3>
        <PaymentElement />
        {error && <div className="checkout-form__error">{error}</div>}
        <button
          type="submit"
          disabled={!stripe || processing}
          className="btn btn--primary btn--large btn--full"
        >
          {processing ? t('checkout.processing') : t('checkout.payNow')}
        </button>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { cart, getCartTotal } = useCart();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (cart.length === 0) return;
    fetch(`${API_URL}/payment/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: getCartTotal() }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to create payment intent');
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <p>{t('cart.empty')}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="page-loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#e8c547',
      colorBackground: '#141414',
      colorText: '#f5f5f5',
      colorDanger: '#ef4444',
      fontFamily: 'Noto Sans SC, sans-serif',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="checkout-page">
      <Elements options={options} stripe={getStripe()}>
        <CheckoutForm
          clientSecret={clientSecret}
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
        />
      </Elements>
    </div>
  );
}
