import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloseIcon, SearchIcon } from '../ui/Icons';
import { menuCategories, menuData } from '../../data/navigation';

export function HomepageMenu({ isOpen, onClose, onSearchClick }: { isOpen: boolean; onClose: () => void; onSearchClick?: () => void }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const sections = activeCategory ? menuData[activeCategory] : undefined;

  useEffect(() => {
    if (!isOpen) setActiveCategory(null);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  /**
   * Close the menu then navigate — SPA best practice so the menu
   * always dismisses when the user picks a link.
   */
  const handleLinkClick = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    navigate(href);
  };

  return (
    <div
      className={`mega-menu${isOpen ? ' active' : ''}${sections ? ' has-submenu' : ''}`}
      id="mega-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      ref={dialogRef}
      onClick={onClose}
    >
      <div className="mega-menu-body" onClick={(e) => e.stopPropagation()}>
        <div className="mega-menu-left">
          <div className="mega-menu-topbar">
            <button className="mega-menu-close" id="menu-close" onClick={onClose} type="button" ref={closeButtonRef}>
              <CloseIcon />
              Close
            </button>
            <button type="button" className="mega-menu-search" onClick={onSearchClick}>
              <SearchIcon />
              Search
            </button>
          </div>
          <ul className={`mega-menu-categories${activeCategory ? ' has-active-category' : ''}`} id="mega-menu-categories">
            {menuCategories.map((category, index) => (
              <li key={category.id}>
                <button
                  key={category.id}
                  data-category={category.id}
                  className={`mega-cat-item${menuData[category.id] ? ' has-sub' : ''}${activeCategory === category.id ? ' active' : ''}`}
                  style={{ transitionDelay: isOpen ? `${index * 0.04}s` : '0s' }}
                  type="button"
                  aria-expanded={menuData[category.id] ? activeCategory === category.id : undefined}
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onFocus={() => setActiveCategory(category.id)}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span>
                    {category.label}
                    {category.badge ? <sup className="badge-new">{category.badge}</sup> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mega-menu-utility">
          </div>
        </div>
        <div className="mega-menu-right" id="mega-menu-right" onClick={onClose}>
          {sections?.map((section, index) => (
            <div 
              className="mega-sub-section" 
              key={`${activeCategory}-${index}`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {section.header ? <div className="mega-sub-header">{section.header}</div> : null}
              <ul className="mega-sub-list">
                {section.links.map((link) => (
                  <li key={link.text}>
                    {link.href ? (
                      <Link className="menu-link" to={link.href} onClick={handleLinkClick(link.href)}>{link.text}</Link>
                    ) : (
                      <button className="menu-link is-placeholder" type="button" aria-disabled="true" data-ui="placeholder">
                        {link.text}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
