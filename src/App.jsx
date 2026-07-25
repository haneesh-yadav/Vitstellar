import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Header, Hero and AboutUs are above-the-fold on first paint, so they stay
// in the main bundle and load eagerly — no point deferring what the user
// sees immediately.
import Header from './components/Header';
import './shared/Main.css';

import StarField from './shared/StarField';

import HeroSection from './components/Hero';
import AboutUsSection from './components/AboutUs';

// Everything below the fold is code-split into its own chunk and fetched
// in parallel while the user is looking at Hero/AboutUs, instead of being
// bundled into the initial JS payload. This is what was making the first
// render feel slow — the browser had to download and parse every section's
// code (modals, carousels, scroll-jack logic, etc.) before anything could
// paint at all.
const FameSection = React.lazy(() => import('./components/Fame'));
const TestimonialsSection = React.lazy(() => import('./components/Testimonials'));
const TeamSection = React.lazy(() => import('./components/Team'));
const MerchandiseSection = React.lazy(() => import('./components/Merchandise'));
const FestSection = React.lazy(() => import('./components/Fest'));
const BoardApplicationSection = React.lazy(() => import('./components/BoardApplication'));
const EventsSection = React.lazy(() => import('./components/Events'));
const PublicationsSection = React.lazy(() => import('./components/Publications'));
const BlogsSection = React.lazy(() => import('./components/Blogs'));
const PartnersSection = React.lazy(() => import('./components/Partners'));
const GallerySection = React.lazy(() => import('./components/Gallery'));
const FaqSection = React.lazy(() => import('./components/Faq'));
const Footer = React.lazy(() => import('./components/Footer'));

function LandingPage() {
  const scrollToHero = () => {
    const container = document.querySelector('.tg-landing');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToSection = (selector) => {
    const container = document.querySelector('.tg-landing');
    const el = document.querySelector(selector);
    if (!el) return;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elemRect = el.getBoundingClientRect();
      const NAV_HEIGHT = 68; // matches .tgh-nav height (56px) + top offset (18px) - keep in sync with Header CSS
      const targetTop = container.scrollTop + elemRect.top - containerRect.top - NAV_HEIGHT;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="tg-landing">
      <StarField />

      <div className="tg-content">
        <Header onTrySudarshanaa={scrollToHero} onScrollToSection={scrollToSection} />

        <HeroSection />

        <AboutUsSection scrollToSection={scrollToSection} />

        {/*
          Single Suspense boundary around everything below AboutUs: all these
          lazy chunks start fetching in parallel as soon as this boundary is
          reached, and React waits for the whole group before committing any
          of them. That avoids each section popping in one-by-one (which
          would keep shifting the page height) — they appear together, once,
          right after AboutUs, instead of the initial bundle having to
          include every section's code up front.
        */}
        <Suspense fallback={null}>
          <FameSection />

          <TestimonialsSection />

          <TeamSection />

          <MerchandiseSection />

          {/* <FestSection /> */}

          {/* <BoardApplicationSection /> */}

          <EventsSection />

          <PublicationsSection />

          <BlogsSection />

          <PartnersSection />

          <GallerySection />

          <FaqSection />

          <div id="contactus">
            <Footer />
          </div>
        </Suspense>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0e',
      fontFamily: "'Poppins', sans-serif",
      textAlign: 'center',
      padding: '2rem',
      boxSizing: 'border-box',
    }}>
      <span style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">🌌</span>
      <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.75rem' }}>
        Page not found
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 2rem', maxWidth: 380 }}>
        The page you're looking for doesn't exist. It may have been moved or the URL might be incorrect.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.08)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.88rem',
          fontWeight: 500,
          padding: '10px 24px',
          borderRadius: 999,
          textDecoration: 'none',
        }}
      >
        ← Back to home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}