import React, { useState, useRef, useEffect } from 'react';
import Icon from '../shared/Icon';
import { Gallery } from '../database/Data';

function GallerySection() {
  const [active, setActive] = useState(0);
  const total = Gallery.items.length;
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const step = (dir) => setActive((prev) => (prev + dir + total) % total);

  // Only autoplay while the section is actually on screen. Without this,
  // the interval kept advancing `active` while the user was reading a
  // different section further down the page; by the time they scrolled
  // back, `active` had jumped several slides ahead, which meant the cards
  // they'd already loaded had been unmounted (see below) and a fresh set
  // had to load right as they came back into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const id = setInterval(() => setActive((prev) => (prev + 1 + total) % total), 10000);
    return () => clearInterval(id);
  }, [total, isVisible]); // total is stable; functional updater doesn't need active in deps

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const handleTouchEnd = () => {
    const SWIPE_THRESHOLD = 40;
    if (touchDeltaX.current <= -SWIPE_THRESHOLD) step(1);
    else if (touchDeltaX.current >= SWIPE_THRESHOLD) step(-1);
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  return (
    <section className="section" id="gallery" ref={sectionRef}>
      <div className="shell shell-narrow">
        <div className="gallery-header">
          <h2 className="gallery-heading">Gallery</h2>
        </div>

        <div
          className="gallery-stage"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {Gallery.items.map((item, i) => {
            let offset = i - active;
            if (offset > total / 2) offset -= total;
            if (offset < -total / 2) offset += total;
            const dist = Math.abs(offset);
            const hidden = dist > 2;
            // Clamp the visual falloff at 2 slides out — cards further than
            // that are hidden anyway, so there's no need to keep computing
            // ever-larger scale/translate values for them.
            const visualDist = Math.min(dist, 2);

            return (
              <div
                className={`gallery-card${offset === 0 ? ' is-active' : ''}`}
                key={item.src}
                style={{
                  transform: `translateX(calc(-50% + ${offset * 230}px)) translateY(${visualDist * 26}px) scale(${1 - visualDist * 0.14})`,
                  zIndex: 10 - visualDist,
                  opacity: hidden ? 0 : (dist === 0 ? 1 : Math.max(1 - dist * 0.32, 0.28)),
                  visibility: hidden ? 'hidden' : 'visible',
                  pointerEvents: hidden ? 'none' : 'auto',
                }}
                onClick={() => offset !== 0 && !hidden && setActive(i)}
                aria-hidden={hidden}
              >
                <img src={item.src} alt={item.alt} loading="lazy" />
                {item.hasPlay && (
                  <span className="gallery-play-btn">
                    <Icon name="play_arrow" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="gallery-nav">
          <button type="button" className="gallery-nav-btn" onClick={() => step(-1)} aria-label="Previous photo">
            <Icon name="arrow_back" />
          </button>
          <button type="button" className="gallery-nav-btn" onClick={() => step(1)} aria-label="Next photo">
            <Icon name="arrow_forward" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default GallerySection;