import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Pause, Play } from '@phosphor-icons/react';
import { useUIStore } from '../store/uiStore';
import { useUIState } from '../components/ui/UIStateContext';
import { MenuIcon, SearchIcon } from '../components/ui/Icons';
import { BrandLogo } from '../components/ui/BrandLogo';
import { HomepageMenu } from '../components/navigation/HomepageMenu';
import { SearchOverlay } from '../components/navigation/SearchOverlay';
import { HeroMediaSkeleton, AdminTableSkeleton } from '../components/ui/Skeletons';
import { UserHeaderActions } from '../components/ui/UserHeaderActions';
import { CartHeaderButton } from '../components/ui/CartHeaderButton';
import { buildHomeSections } from '../data/heroSections';
import { useSiteAssets } from '../hooks/useSiteAssets';
import type { HeroSection } from '../types/catalog';

gsap.registerPlugin(ScrollTrigger);

function HomeHeroSection({ section, skeletonMode }: { section: HeroSection; skeletonMode: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isFirstSection = section.id === 'home';

  useEffect(() => {
    if (skeletonMode || !contentRef.current) return;

    if (isFirstSection) {
      // First hero is always visible on load — animate in immediately,
      // no ScrollTrigger, never reverse.
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', delay: 0.3 },
      );
    } else {
      // Subsequent sections animate in when scrolled into view.
      // "play none none none" = play once, never reverse when scrolling back up.
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        },
      );
    }
  }, [skeletonMode, isFirstSection]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePlay = () => setIsPaused(false);
    const handlePause = () => setIsPaused(true);
    setIsPaused(video.paused);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setIsPaused(false);
      try {
        await video.play();
      } catch {
        setIsPaused(true);
      }
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  return (
    <section className="hero-section" id={section.id}>
      {skeletonMode ? (
        <HeroMediaSkeleton />
      ) : section.mediaType === 'video' ? (
        <>
          <video ref={videoRef} autoPlay muted loop playsInline className="hero-media">
            <source src={section.src} type="video/mp4" />
          </video>
          <button className="listing-pause home-video-toggle" type="button" data-state={isPaused ? 'paused' : 'playing'} aria-label={isPaused ? 'Play video' : 'Pause video'} onClick={togglePlayback}>
            {isPaused ? <Play weight="fill" size={18} /> : <Pause weight="fill" size={18} />}
          </button>
        </>
      ) : (
        <img src={section.src} alt={section.title} className="hero-media" />
      )}
      {!skeletonMode ? (
        <div className="hero-content" ref={contentRef}>
          <h2>{section.title}</h2>
          <div className="cta-group">
            {section.links.map((link) => (
              <a href={link.href} className="cta-link" key={link.text}>{link.text}</a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function HomePage() {
  const { 
    menuOpen, 
    searchOpen, 
    scrolled, 
    setMenuOpen,
    setSearchOpen,
  } = useUIStore();
  const { skeletonMode } = useUIState();
  const { assetMap } = useSiteAssets();
  const homeSections = buildHomeSections(assetMap);
  
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const isScrolled = window.scrollY > 120;
      if (isScrolled !== useUIStore.getState().scrolled) {
        useUIStore.getState().setScrolled(isScrolled);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  return (
    <div className="home-page-wrapper" style={{ '--page-bg': 'var(--color-black)' } as React.CSSProperties}>
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="header-left">
          <button className="menu-btn" id="menu-toggle" aria-controls="mega-menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} type="button" ref={menuButtonRef}>
            <MenuIcon />
            Menu
          </button>
          <button type="button" className="icon-link" onClick={() => setSearchOpen(true)}>
            <SearchIcon />
            Search
          </button>
        </div>
        <div className="header-center">
          <a href="#home" className="logo-link" aria-label="Spark Stage home">
            <BrandLogo className="logo-svg" />
          </a>
        </div>
        <div className="header-right">
          <UserHeaderActions />
          <CartHeaderButton className="header-link" />
        </div>
      </header>
      <main className="main-content">
        <h1 className="sr-only">Spark Stage Official Website</h1>
        {homeSections.map((section) => (
          <HomeHeroSection key={section.id} section={section} skeletonMode={skeletonMode} />
        ))}
        {skeletonMode ? (
          <div className="admin-skeleton-shell">
            <AdminTableSkeleton />
          </div>
        ) : null}
      </main>
    </div>
  );
}
