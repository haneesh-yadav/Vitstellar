import React from 'react';
import Icon from '../shared/Icon';
import { Partners } from '../database/Data';

function PartnersSection() {
  return (
    <section className="section" id="partners">
      <h2 className="pub-heading pub-heading-wide">PARTNERS</h2>
      <div className="shell">
        <div className="partners-grid">
          {Partners.items.map((p, i) => {
            const col = i < 3 ? i + 2 : i - 2;
            const row = i < 3 ? 1 : 2;
            return (
              <div
                className="partners-cell"
                key={p.name}
                style={{ gridColumn: col, gridRow: row }}
              >
                <div className="partners-cell-top">
                  <span className="partners-name">{p.name}</span>
                </div>
                <div className="partners-cell-logo">
                  <img src={p.logo} alt={p.name} loading="lazy" />
                </div>
                <div className="partners-cell-bottom">
                  {p.url && (
                    <a
                      className="partners-view-btn"
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View website <Icon name="north_east" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default PartnersSection;