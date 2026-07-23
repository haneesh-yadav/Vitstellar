import React, { useState, useEffect, useRef } from 'react';
import Icon from '../shared/Icon';
import { Merchandise } from '../database/Data';
import { BoardPositionDropdown } from './BoardApplication';
import { useFestCountdown, festPad } from './Fest';
import { supabase } from '../shared/supabaseClient';

function ScreenshotUpload({ id, file, onChange }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFiles = (fileList) => {
    const picked = fileList && fileList[0];
    if (picked) onChange(picked);
  };

  return (
    <div className="board-pref-dropdown screenshot-upload">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="screenshot-upload-input"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        className="board-pref-trigger screenshot-upload-trigger"
        onClick={() => inputRef.current && inputRef.current.click()}
      >
        <span className="screenshot-upload-info">
          {previewUrl && (
            <img className="screenshot-upload-thumb" src={previewUrl} alt="Payment screenshot preview" />
          )}
          <span className={file ? "" : "board-pref-placeholder"}>
            {file ? file.name : "Upload your payment screenshot"}
          </span>
        </span>
        <Icon name={file ? "check_circle" : "file_upload"} className="board-pref-chevron" />
      </button>
      {file && (
        <button
          type="button"
          className="screenshot-upload-remove"
          onClick={(e) => {
            e.stopPropagation();
            onChange(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
          aria-label="Remove uploaded screenshot"
        >
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}

function MerchandiseSection() {
  const time = useFestCountdown(Merchandise.releaseDate);

  const isDropLive = Date.now() >= Merchandise.releaseDate.getTime();
  const isClosed = Date.now() > Merchandise.closingDate.getTime();
  const isFormOpen = isDropLive && !isClosed;
  const soonStripText = isClosed
    ? 'VIT STELLAR MERCH'
    : isDropLive
    ? `Price : ₹${Merchandise.price} [ ${Merchandise.priceWords} ]`
    : 'Dropping soon';

  const [fullName, setFullName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [printName, setPrintName] = useState('');
  const [size, setSize] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleCopyUpi = () => {
    const doCopy = () => {
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(Merchandise.upiId).then(doCopy).catch(() => {});
    } else {
      const tempInput = document.createElement('textarea');
      tempInput.value = Merchandise.upiId;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();
      try {
        document.execCommand('copy');
        doCopy();
      } catch (err) {}
      document.body.removeChild(tempInput);
    }
  };

  const isEmailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isPhoneValid = (value) => /^\d{10}$/.test(value.trim());

  const getFieldError = (fieldKey) => {
    if (!showValidation) return null;
    switch (fieldKey) {
      case 'fullName':
        return fullName.trim() === '' ? 'Please fill this field' : null;
      case 'regNumber':
        return regNumber.trim() === '' ? 'Please fill this field' : null;
      case 'email':
        if (email.trim() === '') return 'Please fill this field';
        return !isEmailValid(email) ? 'Please enter a valid email address' : null;
      case 'phoneNumber':
        if (phoneNumber.trim() === '') return 'Please fill this field';
        return !isPhoneValid(phoneNumber) ? 'Please enter a valid 10-digit phone number' : null;
      case 'printName':
        return printName.trim() === '' ? 'Please fill this field' : null;
      case 'size':
        return size.trim() === '' ? 'Please select a size' : null;
      case 'paymentScreenshot':
        return !paymentScreenshot ? 'Please upload your payment screenshot' : null;
      default:
        return null;
    }
  };

  const isFormValid =
    fullName.trim() !== '' &&
    regNumber.trim() !== '' &&
    isEmailValid(email) &&
    isPhoneValid(phoneNumber) &&
    printName.trim() !== '' &&
    size.trim() !== '' &&
    !!paymentScreenshot;

  const handleSubmit = async () => {
    if (!isFormValid) {
      setShowValidation(true);
      return;
    }
    if (isSubmitting) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const fileExt = paymentScreenshot.name.split('.').pop();
      const safeReg = regNumber.trim().replace(/[^a-zA-Z0-9]/g, '');
      const filePath = `${safeReg}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, paymentScreenshot);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('merch_orders').insert({
        full_name: fullName.trim(),
        reg_number: regNumber.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),
        print_name: printName.trim(),
        size,
        screenshot_path: filePath,
      });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      // Log a non-sensitive summary — avoid exposing Supabase internals in production
      console.error('[Merchandise] Submission failed:', err?.message ?? 'Unknown error');
      if (err && err.code === '23505') {
        // unique constraint violation on reg_number
        setSubmitError('An order with this Registration Number already exists.');
      } else {
        setSubmitError('Something went wrong while submitting. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section" id="merchandise">
      <div className="shell shell-board-app">
        <div className="board-app-header merch-header">
          <div className="board-app-icon-circle">
            <Icon name="shopping_bag" />
          </div>
          <h2 className="board-app-heading">MERCHANDISE 2026</h2>
        </div>

        <div className="merch-drop-card">
          <div className="merch-drop-banner">
            <img className="merch-drop-banner-img" src={Merchandise.bannerImage} alt="" />
            <div className="merch-drop-banner-overlay" />
            <div className="merch-drop-banner-top">
              {!isDropLive && (
                <div className="merch-drop-countdown">
                  <div className="merch-drop-countdown-cell">
                    <span className="merch-drop-countdown-num">{festPad(time.days)}</span>
                    <span className="merch-drop-countdown-label">Days</span>
                  </div>
                  <div className="merch-drop-countdown-cell">
                    <span className="merch-drop-countdown-num">{festPad(time.hours)}</span>
                    <span className="merch-drop-countdown-label">Hours</span>
                  </div>
                  <div className="merch-drop-countdown-cell">
                    <span className="merch-drop-countdown-num">{festPad(time.minutes)}</span>
                    <span className="merch-drop-countdown-label">Mins</span>
                  </div>
                  <div className="merch-drop-countdown-cell">
                    <span className="merch-drop-countdown-num">{festPad(time.seconds)}</span>
                    <span className="merch-drop-countdown-label">Secs</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="merch-drop-soon-strip">
            <span className={isFormOpen ? "merch-drop-price-text" : ""}>{soonStripText}</span>
          </div>
        </div>

        {isFormOpen && (
        <div className="board-app-outer-card">
          <div className="merch-instructions-box">
            <div className="merch-instructions-title">
              <Icon name="info" />
              <span>Important Instructions</span>
            </div>
            <ul className="merch-instructions-list">
              {Merchandise.instructions.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="merch-form-row">
            <div className="board-app-card merch-form-card">
              <table className="board-app-table">
                <tbody>
                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Full Name</td>
                  <td className="board-app-detail-value">
                    <input
                      id="merch-fullname"
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
                      id="merch-regnumber"
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
                      id="merch-email"
                      type="email"
                      className="board-app-detail-input"
                      placeholder="Enter your Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    {getFieldError('email') && (
                      <p className="board-app-field-error">{getFieldError('email')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Phone Number</td>
                  <td className="board-app-detail-value">
                    <input
                      id="merch-phone"
                      type="tel"
                      className="board-app-detail-input"
                      placeholder="Enter your Phone Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                    {getFieldError('phoneNumber') && (
                      <p className="board-app-field-error">{getFieldError('phoneNumber')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Name to be printed on Merch</td>
                  <td className="board-app-detail-value">
                    <input
                      id="merch-printname"
                      type="text"
                      className="board-app-detail-input"
                      placeholder="Enter the Name to be printed"
                      value={printName}
                      onChange={(e) => setPrintName(e.target.value)}
                      required
                    />
                    {getFieldError('printName') && (
                      <p className="board-app-field-error">{getFieldError('printName')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Size</td>
                  <td className="board-app-detail-value board-app-detail-value--select">
                    <BoardPositionDropdown
                      id="merch-size"
                      value={size}
                      onChange={setSize}
                      options={Merchandise.sizes}
                      placeholder="Select your Size"
                      required
                    />
                    {getFieldError('size') && (
                      <p className="board-app-field-error">{getFieldError('size')}</p>
                    )}
                  </td>
                </tr>

                <tr className="board-app-detail-item">
                  <td className="board-app-detail-label">Upload Payment Screenshot</td>
                  <td className="board-app-detail-value">
                    <ScreenshotUpload
                      id="merch-payment-screenshot"
                      file={paymentScreenshot}
                      onChange={setPaymentScreenshot}
                    />
                    {getFieldError('paymentScreenshot') && (
                      <p className="board-app-field-error">{getFieldError('paymentScreenshot')}</p>
                    )}
                  </td>
                </tr>
                </tbody>
              </table>
            </div>

            <div className="merch-payment-box">
              <p className="merch-price-text">PRICE : ₹{Merchandise.price}</p>
              <div className="merch-qr-frame">
                <img src={Merchandise.qrImage} alt="Payment QR Code" />
              </div>
              <p className="merch-upi-text">OR</p>
              <p
                className="merch-upi-text merch-upi-copy"
                onClick={handleCopyUpi}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopyUpi(); } }}
                title="Click to copy UPI ID"
              >
                UPI ID : <span>{upiCopied ? 'Copied!' : Merchandise.upiId}</span>
              </p>
            </div>
          </div>

          <div className="board-app-outer-footer">
            {submitted ? (
              <span className="board-app-submitted-msg">
                <Icon name="check_circle" />
                <span>Order submitted!</span>
              </span>
            ) : (
              <div className="board-app-submit-wrap">
                {submitError && (
                  <p className="board-app-field-error merch-submit-error">{submitError}</p>
                )}
                <button
                  type="button"
                  className="board-app-next-btn"
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  aria-disabled={!isFormValid || isSubmitting}
                >
                  <span>{isSubmitting ? 'Submitting' : 'Submit'}</span>
                  <Icon
                    name={isSubmitting ? 'progress_activity' : 'check'}
                    className={isSubmitting ? 'icon-spin' : ''}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}

export default MerchandiseSection;