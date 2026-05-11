import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CloseIcon, MenuIcon, SearchIcon } from '../ui/Icons';
import { menuData } from '../../data/navigation';

export function ListingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listingMenuData = useMemo(() => [
    { label: 'New Arrivals', sections: menuData['new-arrivals'].map((section) => ({ title: section.header ?? 'Categories', links: section.links })) },
    { label: 'Women', sections: [{ title: 'Categories', links: menuData.women[0].links }] },
    { label: 'Men', sections: [{ title: 'Categories', links: menuData.men[0].links }] },
    { label: 'Pradasphere', sections: [{ title: 'Explore', links: [{ text: 'Campaigns', href: '/' }, { text: 'Fashion Shows', href: '/' }, { text: 'Store Locator', href: '/' }] }] },
  ], []);
  const active = activeIndex === null ? undefined : listingMenuData[activeIndex];

  useEffect(() => {
    document.body.classList.toggle('listing-menu-open', isOpen);
    return () => document.body.classList.remove('listing-menu-open');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button className="listing-menu-btn" type="button" aria-label="Open menu" aria-controls="listing-menu-panel" aria-expanded={isOpen} onClick={() => {
        setActiveIndex(null);
        setIsOpen(true);
      }}>
        <MenuIcon />
        <span>Menu</span>
      </button>
      <div className={`listing-menu-scrim${isOpen ? ' active' : ''}`} onClick={() => setIsOpen(false)} />
      <div
        className={`listing-menu-panel${isOpen ? ' is-open' : ''}${active ? ' has-submenu' : ''}`}
        id="listing-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="listing-menu-topbar">
          <button className="listing-menu-close" type="button" aria-label="Close menu" onClick={() => setIsOpen(false)}>
            <CloseIcon />
            <span>Close</span>
          </button>
          <button type="button" className="listing-menu-search is-placeholder" aria-label="Search" aria-disabled="true" data-ui="placeholder"><SearchIcon /><span>Search</span></button>
        </div>
        <div className="listing-menu-body">
          <nav className={`listing-menu-categories${activeIndex !== null ? ' has-active-category' : ''}`} aria-label="Menu categories">
            {listingMenuData.map((item, index) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={activeIndex === index}
                className={activeIndex === index ? 'is-active' : ''}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="listing-menu-content">
            {active?.sections.map((section) => (
              <section className="listing-menu-section" key={section.title}>
                <h2>{section.title}</h2>
                <ul>
                  {section.links.map((link) => (
                    <li key={link.text}>
                      {link.href ? (
                        <Link className="menu-link" to={link.href}>{link.text}</Link>
                      ) : (
                        <button className="menu-link is-placeholder" type="button" aria-disabled="true" data-ui="placeholder">
                          {link.text}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
