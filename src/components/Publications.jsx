import React, { useState, useRef, useEffect } from 'react';
import Icon from '../shared/Icon';
import { Publications } from '../database/Data';

function PublicationCard({ pub, reverse = false, onOpen }) {
  const thumb = (
    <div
      className="pub-card-thumb"
      style={!pub.image ? { background: `radial-gradient(120% 120% at 20% 15%, ${pub.accent}33, #14141a 70%)` } : undefined}
    >
      {pub.image ? (
        <img src={pub.image} alt={pub.title} className="pub-card-thumb-img" />
      ) : (
        <Icon name={pub.icon} className="pub-card-thumb-icon" />
      )}
    </div>
  );
  const openBtn = pub.file && (
    <a
      href={pub.file}
      target="_blank"
      rel="noopener noreferrer"
      className="pub-card-open-btn"
      aria-label={`Open ${pub.title} in a new tab`}
    >
      <Icon name="north_east" />
    </a>
  );

  if (reverse) {
    return (
      <div className="pub-card pub-card-reverse">
        <h3 className="pub-card-title">{pub.title}</h3>
        {pub.author && <p className="pub-card-author">By {pub.author}</p>}
        <div className="pub-card-links">
          <button
            type="button"
            className="pub-card-open-btn"
            aria-label={`Read ${pub.title}`}
            onClick={() => onOpen && onOpen(pub)}
          >
            <Icon name="north_east" />
          </button>
        </div>
        {thumb}
      </div>
    );
  }

  return (
    <div className="pub-card">
      {thumb}
      <h3 className="pub-card-title">{pub.title}</h3>
      <p className="pub-card-desc">{pub.desc}</p>
      <div className="pub-card-links">{openBtn}</div>
    </div>
  );
}

function PubModal({ pub, onClose }) {
  const [cachedPub, setCachedPub] = useState(pub);
  const [phase, setPhase] = useState(pub ? "open" : "closed");
  const rafRef = useRef(null);

  useEffect(() => {
    if (pub) {
      setCachedPub(pub);
      setPhase("entering");
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setPhase("open"));
        rafRef.current = raf2;
      });
      rafRef.current = raf1;
      return () => cancelAnimationFrame(rafRef.current);
    }
    if (cachedPub) {
      setPhase("closing");
      const t = setTimeout(() => {
        setPhase("closed");
        setCachedPub(null);
      }, 420);
      return () => clearTimeout(t);
    }
  }, [pub]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (phase === "closed" || !cachedPub) return null;
  const isOpen = phase === "open";

  return (
    <div
      className={"pub-modal-backdrop" + (isOpen ? " is-open" : "")}
      onClick={onClose}
    >
      <div
        className={"pub-modal" + (isOpen ? " is-open" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pub-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pub-modal-header">
          <h3 id="pub-modal-title" className="pub-modal-title">{cachedPub.title}</h3>
          <div className="pub-modal-header-right">
            {cachedPub.author && <p className="pub-modal-author">By {cachedPub.author}</p>}
            <button
              type="button"
              className="pub-modal-close"
              aria-label="Close"
              onClick={onClose}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="pub-modal-body">
          {(cachedPub.body || "").split("\n").filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <a
          href={cachedPub.file || "#"}
          download
          className="pub-modal-download"
          aria-label="Download"
        >
          Download
          <Icon name="download" />
        </a>
      </div>
    </div>
  );
}

function PublicationsSection() {
  const total = Publications.items.length;
  const [activePub, setActivePub] = useState(0);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);

  const stepPub = (dir) => setActivePub((prev) => (prev + dir + total) % total);

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
    if (touchDeltaX.current <= -SWIPE_THRESHOLD) stepPub(1);
    else if (touchDeltaX.current >= SWIPE_THRESHOLD) stepPub(-1);
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  return (
    <div className="pub-wrapper pub-wrapper-static" id="publications">
      <h2 className="pub-heading">PUBLICATIONS</h2>
      <div className="pub-viewport pub-viewport-static pub-viewport-desktop">
        <div className="pub-track pub-track-centered">
          {Publications.items.map((pub) => (
            <PublicationCard pub={pub} key={pub.title} />
          ))}
        </div>
      </div>
      <div className="pub-mobile-carousel">
        <button
          type="button"
          className="gallery-nav-btn"
          onClick={() => stepPub(-1)}
          aria-label="Previous publication"
        >
          <Icon name="arrow_back" />
        </button>

        <div
          className="pub-mobile-card-slot"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <PublicationCard pub={Publications.items[activePub]} key={Publications.items[activePub].title} />
        </div>

        <button
          type="button"
          className="gallery-nav-btn"
          onClick={() => stepPub(1)}
          aria-label="Next publication"
        >
          <Icon name="arrow_forward" />
        </button>
      </div>
    </div>
  );
}

export default PublicationsSection;