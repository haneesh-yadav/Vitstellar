import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import './shared/Main.css';

import StarField from './shared/StarField';

import HeroSection from './components/Hero';
import AboutUsSection from './components/AboutUs';

const FameSection = React.lazy(() => import('./components/Fame'));
const TestimonialsSection = React.lazy(() => import('./components/Testimonials'));
const TeamSection = React.lazy(() => import('./components/Team'));
const MerchandiseSection = React.lazy(() => import('./components/Merchandise'));
const FestSection = React.lazy(() => import('./components/Fest'));
const BoardApplicationSection = React.lazy(() => import('./components/BoardApplication'));
const Domainselection = React.lazy(() => import('./components/Domainselection'));
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
      const NAV_HEIGHT = 68; 
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
        <Header/>

        <HeroSection />

        <AboutUsSection scrollToSection={scrollToSection} />

        <Suspense fallback={null}>
          <FameSection />

          <TestimonialsSection />

          <TeamSection />

          <MerchandiseSection />

          <FestSection />

          {/* <BoardApplicationSection /> */}

          {/* <Domainselection /> */}

          <EventsSection />

          <PublicationsSection />

          <BlogsSection />

          <PartnersSection />

          <GallerySection />

          <FaqSection />

          <Footer />

        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}