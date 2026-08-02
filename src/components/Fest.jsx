import React, { useState, useEffect, useRef } from 'react';
import Icon from '../shared/Icon';
import { Fest } from '../database/Data';
import { TeamSocialIcon } from './Team';

// Toggle to control whether the Sponsor section is displayed.
// Set to false to hide the sponsor box entirely.
function shouldShowSponsor() {
  return false;
}

function festGetTimeLeft(target) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function useFestCountdown(target) {
  const [time, setTime] = useState(() => festGetTimeLeft(target));
  useEffect(() => {
    const id = setInterval(() => setTime(festGetTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

export function festPad(n) {
  return String(n).padStart(2, '0');
}

function FestPocCarousel({ pocs, activeEventIndex = 0, eventsCount, onSelect }) {
  const trackRef = useRef(null);
  const dragInfo = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const [dragging, setDragging] = useState(false);
  // When there's only one event, "active" can't be determined by eventIndex
  // (every poc shares the same eventIndex, so all cards would be marked
  // active at once). Track which poc card is active locally instead — but
  // only matters on mobile, where the layout shows one card at a time.
  // On desktop all poc cards for a single event stay visible together.
  const singleEvent = eventsCount <= 1;
  const [activePocIndex, setActivePocIndex] = useState(0);

  // Mirrors the CSS breakpoint used for the mobile poc-carousel layout.
  const MOBILE_QUERY = '(max-width: 760px)';
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const singleEventMobileSwitching = singleEvent && isMobile && pocs.length > 1;

  useEffect(() => {
    if (activePocIndex >= pocs.length) setActivePocIndex(0);
  }, [pocs.length, activePocIndex]);

  useEffect(() => {
    if (!singleEventMobileSwitching) return;
    const id = setInterval(() => {
      setActivePocIndex((prev) => (prev + 1) % pocs.length);
    }, 10000);
    return () => clearInterval(id);
  }, [singleEventMobileSwitching, pocs.length]);

  const onPointerDown = (e) => {
    const track = trackRef.current;
    if (!track) return;
    dragInfo.current = { active: true, startX: e.clientX, startScroll: track.scrollLeft, moved: false };
    setDragging(true);
    track.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const track = trackRef.current;
    if (!track || !dragInfo.current.active) return;
    const dx = e.clientX - dragInfo.current.startX;
    if (Math.abs(dx) > 4) {
      dragInfo.current.moved = true;
    }
    track.scrollLeft = dragInfo.current.startScroll - dx;
  };

  const endDrag = () => {
    dragInfo.current.active = false;
    setDragging(false);
  };

  const goPrev = () => {
    if (eventsCount > 1) {
      onSelect && onSelect((activeEventIndex - 1 + eventsCount) % eventsCount);
    } else if (singleEventMobileSwitching) {
      setActivePocIndex((prev) => (prev - 1 + pocs.length) % pocs.length);
    } else if (trackRef.current) {
      trackRef.current.scrollBy({ left: -(250 + 24), behavior: 'smooth' });
    }
  };
  const goNext = () => {
    if (eventsCount > 1) {
      onSelect && onSelect((activeEventIndex + 1) % eventsCount);
    } else if (singleEventMobileSwitching) {
      setActivePocIndex((prev) => (prev + 1) % pocs.length);
    } else if (trackRef.current) {
      trackRef.current.scrollBy({ left: 250 + 24, behavior: 'smooth' });
    }
  };
  const showArrows = eventsCount > 1 || pocs.length > 1;

  return (
    <div className="fest-carousel-wrap">
      {showArrows && (
        <button
          type="button"
          className="fest-carousel-arrow fest-carousel-arrow-left"
          onClick={goPrev}
          aria-label="Show previous event"
        >
          <Icon name="arrow_back" />
        </button>
      )}
      <div
        className={`fest-carousel${dragging ? ' dragging' : ''}`}
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {pocs.map((a, i) => {
          const isActive = singleEvent
            ? (singleEventMobileSwitching ? i === activePocIndex : true)
            : a.eventIndex === activeEventIndex;
          const clickable = singleEvent ? singleEventMobileSwitching : !!onSelect;
          return (
          <div
            className={`fest-poc-card${isActive ? ' active' : ' blurred'}`}
            key={`${a.eventIndex}-${a.name}`}
            onClick={() => {
              if (singleEvent) {
                if (singleEventMobileSwitching) setActivePocIndex(i);
              } else {
                onSelect && onSelect(a.eventIndex);
              }
            }}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
          >
            <div className="fest-poc-photo">
              <img src={a.image} alt={a.name} draggable="false" loading="lazy" />
            </div>
            <div className="fest-poc-body">
              <p className="fest-poc-name">{a.name}</p>
              <p className="fest-poc-role">{a.eventTitle} POC</p>
              {a.phone && (
                <a
                  className="fest-poc-contact"
                  href={`tel:${a.phone.replace(/\s+/g, '')}`}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Call ${a.name}`}
                >
                  <TeamSocialIcon type="contact" />
                  <span>{a.phone}</span>
                </a>
              )}
            </div>
          </div>
          );
        })}
      </div>
      {showArrows && (
        <button
          type="button"
          className="fest-carousel-arrow fest-carousel-arrow-right"
          onClick={goNext}
          aria-label="Show next event"
        >
          <Icon name="arrow_forward" />
        </button>
      )}
    </div>
  );
}

function FestGalleryUploadSection() {
  const time = useFestCountdown(Fest.shotsUploadDate);

  const isShotsUploadLive = time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0;
  const driveLink = Fest.galleryDriveLink;

  if (!isShotsUploadLive) return null;

  return (
    <section className="fest-section" id="fest-gallery-uploads" style={{ paddingTop: 32 }}>
      <div className="fest-shell">
        <div className="fest-uploads">
          <div className="board-app-outer-card">
            <h2 className="fest-sponsors-heading">Share Your Shots</h2>
            <p className="fest-sponsors-sub">
              {Fest.galleryUploadDesc}
            </p>

            <div className="board-app-card">
              <table className="board-app-table">
                <tbody>
                  <tr className="board-app-detail-item">
                    <td className="board-app-detail-label">Photos / Videos Upload Drive link</td>
                    <td className="board-app-detail-value">
                      <a
                        href={driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fest-upload-drive-link"
                      >
                        {driveLink}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FestSection() {
  const [activeEvent, setActiveEvent] = useState(0);

  const festPocs = Fest.events.flatMap((ev, eventIndex) =>
    (ev.pocs || []).map((poc) => ({
      ...poc,
      eventIndex,
      eventTitle: ev.eventTitle,
    }))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setActiveEvent((prev) => (prev + 1) % Fest.events.length);
    }, 10000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once — functional updater doesn't need activeEvent in deps

  const titleRowRef = useRef(null);

  const touchState = useRef({ x: 0, y: 0, tracking: false });
  const SWIPE_THRESHOLD = 40;

  const handlePremierTouchStart = (e) => {
    const t = e.touches[0];
    touchState.current = { x: t.clientX, y: t.clientY, tracking: true };
  };

  const handlePremierTouchMove = () => {};

  const handlePremierTouchEnd = (e) => {
    if (!touchState.current.tracking) return;
    touchState.current.tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchState.current.x;
    const dy = t.clientY - touchState.current.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    setActiveEvent((prev) => {
      const count = Fest.events.length;
      if (dx < 0)
        return (prev + 1) % count;
      return (prev - 1 + count) % count;
    });
  };

  return (
    <div className="fest-wrap" id="fest">
      <section className="fest-hero" id="fest-hero">
        <div className="fest-hero-content">
          <h1 className="fest-hero-title">
            <span className="fest-title-row" ref={titleRowRef}>
              <img className="fest-title-logo" src={Fest.logo} alt="Fest 2026 logo" />
            </span>
          </h1>
        </div>

      </section>
      <section className="fest-section" id="fest-premier" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="fest-shell">
          <div
            className="fest-premier-card"
            onTouchStart={handlePremierTouchStart}
            onTouchMove={handlePremierTouchMove}
            onTouchEnd={handlePremierTouchEnd}
          >
            <div className="fest-premier-media">
              <img src={Fest.events[activeEvent].eventImage} alt={Fest.events[activeEvent].eventTitle} loading="lazy" />
            </div>

            <div className="fest-premier-content">
              <div className="fest-premier-top">
                <div>
                  <h2 className="fest-premier-title">
                    {Fest.events[activeEvent].eventTitle}
                  </h2>
                  <p className="fest-premier-subtitle">{Fest.events[activeEvent].org}</p>
                </div>
                {Fest.events[activeEvent].tag && (
                  <span className="fest-premier-tag">{Fest.events[activeEvent].tag}</span>
                )}
              </div>

              <div className="fest-premier-rule" />

              <p className="fest-premier-sub">{Fest.events[activeEvent].eventDesc}</p>

              <div className="fest-premier-rule" />

              <div className="fest-premier-info-row">
                <div className="fest-premier-info-cell">
                  <Icon name="schedule" />
                  <span>{Fest.events[activeEvent].time}</span>
                </div>
                <div className="fest-premier-info-cell">
                  <Icon name="calendar_month" />
                  <span>{Fest.events[activeEvent].date}</span>
                </div>
                <div className="fest-premier-info-cell">
                  <Icon name="groups" />
                  <span>{Fest.events[activeEvent].teamSize}</span>
                </div>
                <a
                  href={Fest.events[activeEvent].registerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="fest-premier-info-cell fest-premier-register-cell"
                >
                  <span>Register Now</span>
                  <Icon name="arrow_forward" />
                </a>
              </div>
            </div>
          </div>

          {Fest.events.length > 1 ? (
            <div
              className="events-timeline"
              style={{ width: `${Fest.events.length * 250 + (Fest.events.length - 1) * 24}px` }}
            >
              <div className="events-timeline-line" />
              <div className="events-timeline-end events-timeline-end-left" />
              <div className="events-timeline-end events-timeline-end-right" />
              {Fest.events.map((ev, i) => (
                <button
                  type="button"
                  className="events-timeline-item"
                  key={i}
                  onClick={() => setActiveEvent(i)}
                  aria-pressed={activeEvent === i}
                  aria-label={`Show ${ev.eventTitle} event`}
                  style={{ left: `${i * (250 + 24) + 250 / 2}px`, transform: 'translateX(-50%)' }}
                >
                  <div className="events-timeline-label">
                    <span>{ev.eventTitle}</span>
                  </div>
                  <div className={`events-timeline-marker${activeEvent === i ? ' active' : ''}`} />
                  <div className="events-timeline-connector" />
                </button>
              ))}
            </div>
          ) : festPocs.length > 1 ? (
            <div
              className="events-timeline-fork"
              style={{ width: `${festPocs.length * 250 + (festPocs.length - 1) * 24}px` }}
              aria-hidden="true"
            >
              <div className="events-timeline-fork-trunk" />
              <div className="events-timeline-fork-bar" />
              {festPocs.map((_, i) => (
                <div
                  key={i}
                  className="events-timeline-fork-branch"
                  style={{ left: `${i * (250 + 24) + 250 / 2}px` }}
                />
              ))}
            </div>
          ) : (
            <div className="events-timeline-single" aria-hidden="true" />
          )}

          <div className="fest-mobile-connector">
            <div className="fest-mobile-line" aria-hidden="true" />
          </div>
        </div>
      </section>
      <section className="fest-section" id="fest-featured" style={{ paddingTop: 44, paddingBottom: 32 }}>
        <FestPocCarousel
          pocs={festPocs}
          activeEventIndex={activeEvent}
          eventsCount={Fest.events.length}
          onSelect={setActiveEvent}
        />
        {Fest.events.length > 1 && (
          <div className="fest-mobile-dots">
            {Fest.events.map((ev, i) => (
              <button
                type="button"
                key={i}
                className={`fest-mobile-dot${activeEvent === i ? ' active' : ''}`}
                onClick={() => setActiveEvent(i)}
                aria-pressed={activeEvent === i}
                aria-label={`Show ${ev.eventTitle} event`}
              />
            ))}
          </div>
        )}
      </section>
      {shouldShowSponsor() && (
        <section className="fest-section" id="fest-partners" style={{ paddingTop: 32 }}>
          <div className="fest-shell">
            <div className="fest-sponsors">
              <h2 className="fest-sponsors-heading">Sponsor</h2>
              <p className="fest-sponsors-sub">{Fest.sponsorsSubtext}</p>

              <div className="fest-sponsor-single-wrap">
                <div className="fest-sponsor-single">
                  <div className="partners-cell-top">
                    <span className="partners-name">{Fest.sponsor.name}</span>
                  </div>
                  <div className="partners-cell-logo">
                    <img src={Fest.sponsor.logo} alt={Fest.sponsor.name} loading="lazy" />
                  </div>
                  <div className="partners-cell-bottom">
                    <a
                      className="partners-view-btn"
                      href={Fest.sponsor.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View website <Icon name="north_east" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      <FestGalleryUploadSection />
    </div>
  );
}

export default FestSection;