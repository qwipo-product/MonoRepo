import { Icon } from './Icons';
import { useI18n } from '@mockups/i18n';

export default function BottomNav({ active, cartCount, onNavigate }: any) {
  const { t } = useI18n();
  return (
    <div className="bottom-nav">
      <button
        className={`nav-item ${active === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <Icon.Home />
        <span>{t('nav.home')}</span>
      </button>
      <button
        className={`nav-item ${active === 'listing' ? 'active' : ''}`}
        onClick={() => onNavigate('listing')}
      >
        <Icon.Reorder />
        <span>{t('nav.reorder')}</span>
      </button>
      <button
        className={`nav-item ${active === 'cart' ? 'active' : ''}`}
        onClick={() => onNavigate('cart')}
      >
        <span className="nav-icon-wrap">
          <Icon.Cart />
          {cartCount > 0 && <div className="nav-badge">{cartCount}</div>}
        </span>
        <span>{t('nav.cart')}</span>
      </button>
    </div>
  );
}
