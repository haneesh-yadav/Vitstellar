import React, { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '../shared/Icon';
import { Blogs } from '../database/Data';

// Below this many cards, the section falls back to a static wrapped layout.
// At or above it, the section pins in place and scrubs the card tray
// horizontally as the user scrolls (on any screen size), releasing once
// the last card has fully entered the viewport.
const SCROLL_JACK_THRESHOLD = 5;

function BlogCard({ post, onOpen }) {
  const thumb = (
    <div
      className="bp-card-thumb"
      style={!post.image ? { background: `radial-gradient(120% 120% at 20% 15%, ${post.accent}33, #14141a 70%)` } : undefined}
    >
      {post.image ? (
        <img src={post.image} alt={post.title} className="bp-card-thumb-img" />
      ) : (
        <Icon name={post.icon} className="bp-card-thumb-icon" />
      )}
    </div>
  );

  return (
    <div className="bp-card">
      <h3 className="bp-card-title">{post.title}</h3>
      {post.author && <p className="bp-card-author">By {post.author}</p>}
      <div className="bp-card-links">
        <button
          type="button"
          className="bp-card-open-btn"
          aria-label={`Read ${post.title}`}
          onClick={() => onOpen && onOpen(post)}
        >
          <Icon name="north_east" />
        </button>
      </div>
      {thumb}
    </div>
  );
}

function BlogModal({ post, onClose }) {
  const [cachedPost, setCachedPost] = useState(post);
  const [phase, setPhase] = useState(post ? "open" : "closed");
  const rafRef = useRef(null);

  useEffect(() => {
    if (post) {
      setCachedPost(post);
      setPhase("entering");
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setPhase("open"));
        rafRef.current = raf2;
      });
      rafRef.current = raf1;
      return () => cancelAnimationFrame(rafRef.current);
    }
    if (cachedPost) {
      setPhase("closing");
      const t = setTimeout(() => {
        setPhase("closed");
        setCachedPost(null);
      }, 420);
      return () => clearTimeout(t);
    }
  }, [post]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (phase === "closed" || !cachedPost) return null;
  const isOpen = phase === "open";

  return (
    <div
      className={"bp-modal-backdrop" + (isOpen ? " is-open" : "")}
      onClick={onClose}
    >
      <div
        className={"bp-modal" + (isOpen ? " is-open" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bp-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bp-modal-header">
          <h3 id="bp-modal-title" className="bp-modal-title">{cachedPost.title}</h3>
          <div className="bp-modal-header-right">
            {cachedPost.author && <p className="bp-modal-author">By {cachedPost.author}</p>}
            <button
              type="button"
              className="bp-modal-close"
              aria-label="Close"
              onClick={onClose}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="bp-modal-body">
          {(cachedPost.body || "").split("\n").filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Walks up the DOM to find the nearest ancestor that is actually scrollable
// (overflow-y auto/scroll and has overflow content). Falls back to window.
// This app scrolls inside `.tg-landing`, not `window`/`body`, so scroll
// listeners must be attached to that real scroll container.
function getScrollParent(el) {
  let node = el ? el.parentElement : null;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

// Finds a fixed/sticky navbar pinned near the top of the viewport (if any)
// and returns how far down its bottom edge sits. The scroll-jacked section
// should pin itself just below that point, not at the very top (0), or the
// navbar will overlap the cards while they're pinned.
function getNavOffset() {
  const candidates = document.querySelectorAll('nav, header, [class*="nav" i], [class*="header" i]');
  let offset = 0;
  candidates.forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' || style.position === 'sticky') {
      const rect = el.getBoundingClientRect();
      if (rect.top <= 40 && rect.height > 0 && rect.bottom > offset) {
        offset = Math.ceil(rect.bottom);
      }
    }
  });
  return offset;
}

// Drives the pinned horizontal scroll: measures how far the track overflows
// its viewport, then converts vertical scroll progress through a tall
// "runway" wrapper into a horizontal translateX on the track.
function useScrollJack(enabled) {
  const outerRef = useRef(null);
  const stickyRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [maxTranslate, setMaxTranslate] = useState(0);
  const [stickyHeight, setStickyHeight] = useState(0);
  const [translate, setTranslate] = useState(0);
  const [navOffset, setNavOffset] = useState(0);

  const measure = useCallback(() => {
    if (!enabled) return;
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const sticky = stickyRef.current;
    if (!track || !viewport || !sticky) return;
    setMaxTranslate(Math.max(0, track.scrollWidth - viewport.clientWidth));
    setStickyHeight(sticky.offsetHeight);
    setNavOffset(getNavOffset());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [enabled, measure]);

  useEffect(() => {
    if (!enabled) return;
    // Bind to the real scrolling ancestor (e.g. `.tg-landing`), not window,
    // since window/body scrolling is disabled in this app.
    const scrollTarget = getScrollParent(outerRef.current);

    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const outer = outerRef.current;
        if (!outer) return;
        if (maxTranslate <= 0) {
          setTranslate(0);
          return;
        }
        const rect = outer.getBoundingClientRect();
        const scrollableHeight = rect.height - stickyHeight;
        if (scrollableHeight <= 0) {
          setTranslate(0);
          return;
        }
        // rect.top reaches `navOffset` (not 0) once the section is pinned,
        // since the sticky child sits `navOffset`px from the top to clear
        // the navbar. Progress should start counting from that point.
        const progress = Math.min(1, Math.max(0, (navOffset - rect.top) / scrollableHeight));
        setTranslate(progress * maxTranslate);
      });
    };
    onScroll();
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollTarget.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled, maxTranslate, stickyHeight, navOffset]);

  const outerHeight = enabled && maxTranslate > 0 ? `${stickyHeight + maxTranslate}px` : undefined;

  return { outerRef, stickyRef, viewportRef, trackRef, translate, outerHeight, navOffset };
}

function BlogsSection() {
  const items = Blogs.items;
  const total = items.length;
  const scrollJackEnabled = total >= SCROLL_JACK_THRESHOLD;
  const { outerRef, stickyRef, viewportRef, trackRef, translate, outerHeight, navOffset } = useScrollJack(scrollJackEnabled);

  const [modalPost, setModalPost] = useState(null);

  return (
    <div className={"bp-wrapper" + (scrollJackEnabled ? "" : " bp-wrapper-static")} id="blogs">
      {!scrollJackEnabled && (
        <div className="bp-heading-row">
          <h2 className="bp-heading">BLOGS</h2>
        </div>
      )}

      {scrollJackEnabled ? (
        <div ref={outerRef} className="bp-scroll-outer" style={{ height: outerHeight }}>
          <div ref={stickyRef} className="bp-sticky" style={{ top: navOffset }}>
            <div className="bp-heading-row">
              <h2 className="bp-heading">BLOGS</h2>
            </div>
            <div ref={viewportRef} className="bp-viewport">
              <div
                ref={trackRef}
                className="bp-track"
                style={{ transform: `translateX(-${translate}px)` }}
              >
                {items.map((post) => (
                  <BlogCard post={post} key={post.title} onOpen={setModalPost} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bp-viewport bp-viewport-static">
          <div className="bp-track bp-track-centered">
            {items.map((post) => (
              <BlogCard post={post} key={post.title} onOpen={setModalPost} />
            ))}
          </div>
        </div>
      )}

      <BlogModal post={modalPost} onClose={() => setModalPost(null)} />
    </div>
  );
}

export default BlogsSection;