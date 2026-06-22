import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { getCartCount } = useCart();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'zh', label: 'ZH' },
  ];

  const navLinks = [
    { to: '/', label: t('nav.menu') },
    { to: '/cart', label: t('nav.cart'), badge: getCartCount() },
    { to: '/orders', label: t('nav.orders') },
    { to: '/admin', label: t('nav.admin') },
  ];

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__inner">
        <Link to="/" className="header__logo">
          demo001
        </Link>
        <nav className="header__nav">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`header__link ${location.pathname === link.to ? 'header__link--active' : ''}`}
            >
              {link.label}
              {link.badge > 0 && <span className="header__badge">{link.badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="header__lang">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`header__lang-btn ${i18n.language === lang.code ? 'header__lang-btn--active' : ''}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
