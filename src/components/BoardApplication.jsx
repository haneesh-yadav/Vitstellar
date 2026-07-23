import React, { useState, useEffect, useRef } from 'react';
import Icon from '../shared/Icon';
import { BoardApplication } from '../database/Data';
import { useFestCountdown, festPad } from './Fest';
import { supabase } from '../shared/supabaseClient';

const BOARD_APP_TABS = [
  { key: "apply", label: "Applicant Details", icon: "how_to_reg" },
  { key: "boardpref", label: "Board Preference", icon: "groups" },
  { key: "experience", label: "Experience in Action", icon: "emoji_events" },
];

const RESULTS_PENDING_TEXT = 'Results will be announced soon, Stay Tuned!';

function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function formatBoardAppDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function computeBoardAppPhase() {
  if (BoardApplication.phaseOverride) return BoardApplication.phaseOverride;
  const now = new Date();
  if (now < BoardApplication.openDate) return 'not_open';
  if (now < BoardApplication.deadline) return 'applications';
  if (now < BoardApplication.slotsStart) return 'applications_closed';
  if (now < BoardApplication.slotsEnd) return 'slots';
  return now < BoardApplication.resultsDate ? 'results_pending' : 'results';
}

function useBoardAppPhase() {
  const [phase, setPhase] = useState(computeBoardAppPhase);
  useEffect(() => {
    const id = setInterval(() => setPhase(computeBoardAppPhase()), 1000);
    return () => clearInterval(id);
  }, []);
  return phase;
}

export function BoardPositionDropdown({ id, value, onChange, options, placeholder = "Select a position" }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
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

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setDropUp(spaceBelow < 320 && spaceAbove > spaceBelow);
    }
    setOpen((o) => !o);
  };

  return (
    <div className="board-pref-dropdown" ref={ref}>
      <button
        type="button"
        id={id}
        className="board-pref-trigger"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? "" : "board-pref-placeholder"}>{value || placeholder}</span>
        <Icon name="expand_more" className={`board-pref-chevron${open ? " open" : ""}`} />
      </button>

      {open && (
        <ul className={`board-pref-menu${dropUp ? " drop-up" : ""}`} role="listbox" aria-label={placeholder}>
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                role="option"
                aria-selected={opt === value}
                className={`board-pref-option${opt === value ? " active" : ""}`}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BoardApplicationSection() {
  const openCountdown = useFestCountdown(BoardApplication.openDate);
  const [activeAppTab, setActiveAppTab] = useState(BOARD_APP_TABS[0].key);
  const [unlockedTabIndex, setUnlockedTabIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [fullName, setFullName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [vitEmail, setVitEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [firstPref, setFirstPref] = useState('');
  const [firstWhy, setFirstWhy] = useState('');
  const [secondPref, setSecondPref] = useState('');
  const [secondWhy, setSecondWhy] = useState('');
  const [peerSuggestions, setPeerSuggestions] = useState('');
  const [experienceAnswers, setExperienceAnswers] = useState({});
  const [slotsDateIndex, setSlotsDateIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleExperienceChange = (id, value) => {
    setExperienceAnswers((prev) => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    setShowValidation(false);
  }, [activeAppTab]);

  useEffect(() => {
    if (secondPref && secondPref === firstPref) {
      setSecondPref('');
    }
  }, [firstPref, secondPref]);

  const activeTabIndex = BOARD_APP_TABS.findIndex((t) => t.key === activeAppTab);
  const isLastTab = activeTabIndex === BOARD_APP_TABS.length - 1;

  const isEmailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isPhoneValid = (value) => /^\d{10}$/.test(value.trim());

  const getFieldError = (fieldKey) => {
    if (!showValidation) return null;
    switch (fieldKey) {
      case 'fullName':
        return fullName.trim() === '' ? 'Please fill this field' : null;
      case 'regNumber':
        return regNumber.trim() === '' ? 'Please fill this field' : null;
      case 'vitEmail':
        if (vitEmail.trim() === '') return 'Please fill this field';
        return !isEmailValid(vitEmail) ? 'Please enter a valid email address' : null;
      case 'contactNumber':
        if (contactNumber.trim() === '') return 'Please fill this field';
        return !isPhoneValid(contactNumber) ? 'Please enter a valid 10-digit contact number' : null;
      case 'preferredDate':
        return preferredDate.trim() === '' ? 'Please select a date' : null;
      case 'firstPref':
        return firstPref.trim() === '' ? 'Please select a position' : null;
      case 'firstWhy':
        return firstWhy.trim() === '' ? 'Please fill this field' : null;
      case 'secondPref':
        return secondPref.trim() === '' ? 'Please select a position' : null;
      case 'secondWhy':
        return secondWhy.trim() === '' ? 'Please fill this field' : null;
      case 'peerSuggestions':
        return peerSuggestions.trim() === '' ? 'Please fill this field' : null;
      default:
        return (experienceAnswers[fieldKey] || '').trim() === '' ? 'Please fill this field' : null;
    }
  };

  const isTabComplete = (key) => {
    if (key === 'apply') {
      return (
        fullName.trim() !== '' &&
        regNumber.trim() !== '' &&
        isEmailValid(vitEmail) &&
        isPhoneValid(contactNumber) &&
        preferredDate.trim() !== ''
      );
    }
    if (key === 'boardpref') {
      return [firstPref, firstWhy, secondPref, secondWhy, peerSuggestions].every((v) => v.trim() !== '');
    }
    if (key === 'experience') {
      return BoardApplication.experienceFields.every((field) => (experienceAnswers[field.id] || '').trim() !== '');
    }
    return false;
  };

  const currentTabValid = isTabComplete(activeAppTab);

  const handleTabClick = (index, key) => {
    if (index > unlockedTabIndex)
      return;
    setActiveAppTab(key);
  };

  const handleNextOrSubmit = async () => {
    if (!currentTabValid) {
      setShowValidation(true);
      return;
    }
    if (isLastTab) {
      if (isSubmitting) return;
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        const trimmedRegNumber = regNumber.trim();

        const experienceColumns = {};
        BoardApplication.experienceFields.forEach((field) => {
          experienceColumns[toSnakeCase(field.id)] = (experienceAnswers[field.id] || '').trim();
        });

        const row = {
          full_name: fullName.trim(),
          reg_number: trimmedRegNumber,
          vit_email: vitEmail.trim(),
          contact_number: contactNumber.trim(),
          preferred_date: preferredDate,
          first_pref: firstPref,
          first_why: firstWhy.trim(),
          second_pref: secondPref,
          second_why: secondWhy.trim(),
          peer_suggestions: peerSuggestions.trim(),
          ...experienceColumns,
        };

        const { error } = await supabase.from('board_applications').insert([row]);

        if (error) throw error;

        setSubmitted(true);
      } catch (err) {
        // Log a non-sensitive summary — avoid exposing Supabase internals in production
        console.error('[BoardApplication] Submission failed:', err?.message ?? 'Unknown error');
        if (err && err.code === '23505') {
          setSubmitError('An application with this Registration Number already exists.');
        } else {
          setSubmitError('Something went wrong while submitting. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    const nextIndex = activeTabIndex + 1;
    setUnlockedTabIndex((prev) => Math.max(prev, nextIndex));
    setActiveAppTab(BOARD_APP_TABS[nextIndex].key);
  };

  const handleBack = () => {
    if (activeTabIndex === 0) return;
    setActiveAppTab(BOARD_APP_TABS[activeTabIndex - 1].key);
  };

  const phase = useBoardAppPhase();
  const headingIcon = 'how_to_reg';

  return (
    <section className="section" id="board-application">
      <div className="shell shell-board-app">
        <div className="board-app-header">
          <div className="board-app-icon-circle">
            <Icon name={headingIcon} />
          </div>
          <h2 className="board-app-heading">BOARD APPLICATION 2027</h2>
        </div>

        {phase === 'not_open' && (
          <div className="board-app-status-card">
            <h3 className="board-app-status-title">Applications open on {formatBoardAppDate(BoardApplication.openDate)}</h3>
            <div className="merch-drop-countdown board-app-status-countdown">
              <div className="merch-drop-countdown-cell">
                <span className="merch-drop-countdown-num">{festPad(openCountdown.days)}</span>
                <span className="merch-drop-countdown-label">Days</span>
              </div>
              <div className="merch-drop-countdown-cell">
                <span className="merch-drop-countdown-num">{festPad(openCountdown.hours)}</span>
                <span className="merch-drop-countdown-label">Hours</span>
              </div>
              <div className="merch-drop-countdown-cell">
                <span className="merch-drop-countdown-num">{festPad(openCountdown.minutes)}</span>
                <span className="merch-drop-countdown-label">Mins</span>
              </div>
              <div className="merch-drop-countdown-cell">
                <span className="merch-drop-countdown-num">{festPad(openCountdown.seconds)}</span>
                <span className="merch-drop-countdown-label">Secs</span>
              </div>
            </div>
          </div>
        )}

        {phase === 'applications' && (
        <>
        <div className="board-app-outer-card">
          <div className="merch-instructions-box">
            <div className="merch-instructions-title">
              <Icon name="info" />
              <span>Important Instructions</span>
            </div>
            <ul className="merch-instructions-list">
              {BoardApplication.formInstructions.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="board-app-tabbar-row">
            <div className="board-app-tabbar">
              {BOARD_APP_TABS.map((tab, index) => (
                <button
                  type="button"
                  key={tab.key}
                  className={`board-app-tab${activeAppTab === tab.key ? ' active' : ''}`}
                  onClick={() => handleTabClick(index, tab.key)}
                  aria-pressed={activeAppTab === tab.key}
                >
                  <Icon name={tab.icon} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="board-app-card">
          <table className="board-app-table">
            <tbody>
            {activeAppTab === 'apply' && (
              <>
                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Full Name</td>
                  <td className="board-app-detail-value">
                    <input
                      id="board-app-fullname"
                      type="text"
                      className="board-app-detail-input"
                      placeholder="Enter your Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                    {getFieldError('fullName') && (
                      <p className="board-app-field-error">{getFieldError('fullName')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Registration Number</td>
                  <td className="board-app-detail-value">
                    <input
                      id="board-app-regnumber"
                      type="text"
                      className="board-app-detail-input"
                      placeholder="Enter your Registration Number"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      required
                    />
                    {getFieldError('regNumber') && (
                      <p className="board-app-field-error">{getFieldError('regNumber')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">VIT Email</td>
                  <td className="board-app-detail-value">
                    <input
                      id="board-app-vitemail"
                      type="email"
                      className="board-app-detail-input"
                      placeholder="Enter your VIT Email"
                      value={vitEmail}
                      onChange={(e) => setVitEmail(e.target.value)}
                      required
                    />
                    {getFieldError('vitEmail') && (
                      <p className="board-app-field-error">{getFieldError('vitEmail')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Contact Number</td>
                  <td className="board-app-detail-value">
                    <input
                      id="board-app-contactnumber"
                      type="tel"
                      className="board-app-detail-input"
                      placeholder="Enter your Contact Number"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      maxLength={10}
                      required
                    />
                    {getFieldError('contactNumber') && (
                      <p className="board-app-field-error">{getFieldError('contactNumber')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Preferred Date for Interview</td>
                  <td className="board-app-detail-value board-app-detail-value--select">
                    <BoardPositionDropdown
                      id="board-app-preferreddate"
                      value={preferredDate}
                      onChange={setPreferredDate}
                      options={BoardApplication.preferredInterviewDates}
                      placeholder="Select a date"
                      required
                    />
                    {getFieldError('preferredDate') && (
                      <p className="board-app-field-error">{getFieldError('preferredDate')}</p>
                    )}
                  </td>
                </tr>
              </>
            )}

            {activeAppTab === 'boardpref' && (
              <>
                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">First Preference For Board Position</td>
                  <td className="board-app-detail-value board-app-detail-value--select">
                    <BoardPositionDropdown
                      id="board-app-firstpref"
                      value={firstPref}
                      onChange={setFirstPref}
                      options={BoardApplication.positions}
                      required
                    />
                    {getFieldError('firstPref') && (
                      <p className="board-app-field-error">{getFieldError('firstPref')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Why should we consider you for this position?</td>
                  <td className="board-app-detail-value">
                    <textarea
                      id="board-app-firstwhy"
                      className="board-app-detail-textarea"
                      placeholder="Tell us why..."
                      rows={3}
                      value={firstWhy}
                      onChange={(e) => setFirstWhy(e.target.value)}
                      required
                    />
                    {getFieldError('firstWhy') && (
                      <p className="board-app-field-error">{getFieldError('firstWhy')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Second Preference For Board Position</td>
                  <td className="board-app-detail-value board-app-detail-value--select">
                    <BoardPositionDropdown
                      id="board-app-secondpref"
                      value={secondPref}
                      onChange={setSecondPref}
                      options={BoardApplication.positions.filter((p) => p !== firstPref)}
                      required
                    />
                    {getFieldError('secondPref') && (
                      <p className="board-app-field-error">{getFieldError('secondPref')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Why should we consider you for this position?</td>
                  <td className="board-app-detail-value">
                    <textarea
                      id="board-app-secondwhy"
                      className="board-app-detail-textarea"
                      placeholder="Tell us why..."
                      rows={3}
                      value={secondWhy}
                      onChange={(e) => setSecondWhy(e.target.value)}
                      required
                    />
                    {getFieldError('secondWhy') && (
                      <p className="board-app-field-error">{getFieldError('secondWhy')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Suggest 3 of your peers, who you think are eligible to become board members in the next term.</td>
                  <td className="board-app-detail-value">
                    <textarea
                      id="board-app-peers"
                      className="board-app-detail-textarea"
                      placeholder="Enter names, separated by commas"
                      rows={3}
                      value={peerSuggestions}
                      onChange={(e) => setPeerSuggestions(e.target.value)}
                      required
                    />
                    {getFieldError('peerSuggestions') && (
                      <p className="board-app-field-error">{getFieldError('peerSuggestions')}</p>
                    )}
                  </td>
                </tr>
              </>
            )}

            {activeAppTab === 'experience' && BoardApplication.experienceFields.map((field) => (
              <tr className="board-app-detail-item" key={field.id}>
                <td className="board-app-detail-label">{field.label}</td>
                <td className="board-app-detail-value">
                  <textarea
                    id={`board-app-${field.id}`}
                    className="board-app-detail-textarea"
                    placeholder="Type your answer..."
                    rows={3}
                    value={experienceAnswers[field.id] || ''}
                    onChange={(e) => handleExperienceChange(field.id, e.target.value)}
                    required
                  />
                  {getFieldError(field.id) && (
                    <p className="board-app-field-error">{getFieldError(field.id)}</p>
                  )}
                </td>
              </tr>
            ))}
            </tbody>
          </table>
          </div>

          <div className="board-app-outer-footer">
            {submitted ? (
              <span className="board-app-submitted-msg">
                <Icon name="check_circle" />
                <span>Application submitted!</span>
              </span>
            ) : (
              <>
                {activeTabIndex > 0 && (
                  <button
                    type="button"
                    className="board-app-back-btn"
                    onClick={handleBack}
                  >
                    <Icon name="arrow_back" />
                    <span>Go Back</span>
                  </button>
                )}
                <div className="board-app-submit-wrap">
                  {submitError && (
                    <p className="board-app-field-error merch-submit-error">{submitError}</p>
                  )}
                  <button
                    type="button"
                    className="board-app-next-btn"
                    onClick={handleNextOrSubmit}
                    disabled={!currentTabValid || isSubmitting}
                    aria-disabled={!currentTabValid || isSubmitting}
                  >
                    <span>{isLastTab ? (isSubmitting ? 'Submitting' : 'Submit') : 'Next Section'}</span>
                    <Icon
                      name={isLastTab && isSubmitting ? 'progress_activity' : (isLastTab ? 'check' : 'arrow_forward')}
                      className={isLastTab && isSubmitting ? 'icon-spin' : ''}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </>
        )}

        {phase === 'applications_closed' && (
          <div className="board-app-status-card">
            <div className="board-app-status-icon">
              <Icon name="event_busy" />
            </div>
            <h3 className="board-app-status-title">Board Applications Closed!</h3>
            <h3 className="board-app-status-title">Interview Slots will be out soon!</h3>
          </div>
        )}

        {phase === 'slots' && (
          <>
            {(() => {
              const clampedIndex = Math.min(slotsDateIndex, BoardApplication.interviewSlots.length - 1);
              const group = BoardApplication.interviewSlots[clampedIndex];
              const hasMultipleDates = BoardApplication.interviewSlots.length > 1;
              return (
                <div className="board-app-outer-card board-app-slots-group">
                  <div className="merch-instructions-box">
                    <div className="merch-instructions-title">
                      <Icon name="info" />
                      <span>Important Instructions</span>
                    </div>
                    <ul className="merch-instructions-list">
                      {BoardApplication.slotInstructions.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="board-app-tabbar-row">
                    <div className="board-app-tabbar">
                      <button type="button" className="board-app-tab active" aria-pressed="true">
                        <Icon name="event_available" />
                        <span>Interview Slots</span>
                      </button>
                    </div>
                  </div>

                  <div className="board-app-card">
                    <div className="board-app-slots-date-banner">
                      <button
                        type="button"
                        className="board-app-slots-date-arrow"
                        onClick={() => setSlotsDateIndex((i) => Math.max(0, i - 1))}
                        disabled={!hasMultipleDates || clampedIndex === 0}
                        aria-label="Previous interview date"
                      >
                        <Icon name="chevron_left" />
                      </button>

                      <div className="board-app-slots-date-center">
                        <span>{group.date}</span>
                      </div>

                      <button
                        type="button"
                        className="board-app-slots-date-arrow"
                        onClick={() => setSlotsDateIndex((i) => Math.min(BoardApplication.interviewSlots.length - 1, i + 1))}
                        disabled={!hasMultipleDates || clampedIndex === BoardApplication.interviewSlots.length - 1}
                        aria-label="Next interview date"
                      >
                        <Icon name="chevron_right" />
                      </button>
                    </div>
                    <table className="board-app-slots-table">
                      <thead>
                        <tr>
                          <th>Register Number</th>
                          <th>Name</th>
                          <th>Time Slot</th>
                          <th>Venue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.slots.map((slot, i) => (
                          <tr key={`${slot.name}-${i}`}>
                            <td>{slot.regNumber}</td>
                            <td>{slot.name}</td>
                            <td>{slot.time}</td>
                            <td>{slot.venue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {phase === 'results_pending' && (
          <div className="board-app-status-card">
            <div className="board-app-status-icon">
              <Icon name="hourglass_top" />
            </div>
            <h3 className="board-app-status-title">Interviews Done!</h3>
            <p className="board-app-status-sub">{RESULTS_PENDING_TEXT}</p>
          </div>
        )}

        {phase === 'results' && (
          <>
            <div className="board-app-outer-card">
              <div className="board-app-tabbar-row">
                <div className="board-app-tabbar">
                  <button type="button" className="board-app-tab active" aria-pressed="true">
                    <Icon name="emoji_events" />
                    <span>Results</span>
                  </button>
                </div>
              </div>

              <div className="board-app-card">
                <table className="board-app-slots-table">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Year</th>
                      <th>Register Number</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BoardApplication.results.map((result, i) => (
                      <tr key={`${result.name}-${i}`}>
                        <td>{result.position}</td>
                        <td>{result.year}</td>
                        <td>{result.regNumber}</td>
                        <td>{result.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default BoardApplicationSection;