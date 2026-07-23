import React, { useState, useRef, useEffect } from 'react';
import Icon from '../shared/Icon';
import { Team } from '../database/Data';

const TEAM_YEARS = Object.keys(Team).map(Number).sort((a, b) => b - a);

export function TeamSocialIcon({ type }) {
  if (type === "github") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    );
  }
  if (type === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (type === "contact") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function TeamCard({ member, showSocials = false }) {
  return (
    <div className={`team-card team-card-${member.offset || "none"}`}>
      <div className="team-card-photo">
        <img src={member.photo} alt={member.name} loading="lazy" />
      </div>
      <div className={`team-card-body${showSocials ? " team-card-body-social" : ""}`}>
        <div className="team-card-name">{member.name}</div>
        <div className="team-card-role">{member.role}</div>
        {member.desc && <p className="team-card-desc">{member.desc}</p>}
        {showSocials && (
          <div className="team-card-socials">
            
            {member.links?.linkedin && (
              <a
                className="team-social-btn team-social-linkedin"
                href={member.links.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label={`${member.name} LinkedIn`}
              >
                <TeamSocialIcon type="linkedin" />
              </a>
            )}
            {member.links?.github && (
              <a
                className="team-social-btn team-social-github"
                href={member.links.github}
                target="_blank"
                rel="noreferrer"
                aria-label={`${member.name} GitHub`}
              >
                <TeamSocialIcon type="github" />
              </a>
            )}
            {member.links?.website && (
              <a
                className="team-social-btn team-social-website"
                href={member.links.website}
                target="_blank"
                rel="noreferrer"
                aria-label={`${member.name} website`}
              >
                <TeamSocialIcon type="website" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamYearDropdown({ year, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <span className="team-year-dropdown" ref={ref}>
      <button
        type="button"
        className="team-year-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {year}
        <Icon name="expand_more" className={`team-year-chevron${open ? " open" : ""}`} />
      </button>

      {open && (
        <ul className="team-year-menu" role="listbox" aria-label="Select board year">
          {TEAM_YEARS.map((y) => (
            <li key={y}>
              <button
                type="button"
                role="option"
                aria-selected={y === year}
                className={`team-year-option${y === year ? " active" : ""}`}
                onClick={() => {
                  onChange(y);
                  setOpen(false);
                }}
              >
                {y}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

function TeamSection() {
  const [teamYear, setTeamYear] = useState(TEAM_YEARS[0]);
  const activeBoard = Team[teamYear];

  return (
    <section className="section" id="team">
      <div className="shell">
        <div className="team-header">
          <h2 className="team-heading">
            MEET THE TEAM <TeamYearDropdown year={teamYear} onChange={setTeamYear} />
          </h2>
        </div>

        <div className="team-stage">

          {activeBoard.team.map((member) => (
            <TeamCard
              member={member}
              showSocials={member.name !== ""}
              key={`${teamYear}-${member.name}`}
            />
          ))}
        </div>

        <div className="team-grid team-grid-close">
          {activeBoard.grid1.map((member) => (
            <TeamCard member={member} showSocials key={`${teamYear}-grid1-${member.name}`} />
          ))}
        </div>

        <div className="team-grid">
          {activeBoard.grid2.map((member) => (
            <TeamCard member={member} showSocials key={`${teamYear}-grid2-${member.name}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamSection;