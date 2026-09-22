'use client';

import React from 'react';

const SkeletonLine = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <div
      className={`library-skeleton-line ${className}`}
    />
  );
};

const SkeletonCard = () => {
  return (
    <div className="library-skeleton-card">
      <div className="library-skeleton-cover">
        <div className="library-skeleton-shimmer" />
      </div>

      <div className="library-skeleton-card-content">
        <SkeletonLine className="library-skeleton-title" />
        <SkeletonLine className="library-skeleton-author" />
        <SkeletonLine className="library-skeleton-meta" />
      </div>
    </div>
  );
};

export default function LibrarySkeleton() {
  return (
    <div className="library-loading-page">

      {/* ==========================================
          HERO SKELETON
      ========================================== */}

      <section className="library-skeleton-hero">

        <div className="library-skeleton-hero-content">
          <SkeletonLine className="hero-small" />

          <SkeletonLine className="hero-title" />

          <SkeletonLine className="hero-description" />

          <div className="library-skeleton-buttons">
            <SkeletonLine className="hero-button" />
            <SkeletonLine className="hero-button secondary" />
          </div>
        </div>

      </section>


      {/* ==========================================
          SECTION 1
      ========================================== */}

      <section className="library-skeleton-section">

        <div className="library-skeleton-section-header">
          <div>
            <SkeletonLine className="section-small" />
            <SkeletonLine className="section-title" />
          </div>

          <SkeletonLine className="section-link" />
        </div>

        <div className="library-skeleton-grid">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <SkeletonCard key={index} />
            )
          )}
        </div>

      </section>


      {/* ==========================================
          SECTION 2
      ========================================== */}

      <section className="library-skeleton-section">

        <div className="library-skeleton-section-header">
          <div>
            <SkeletonLine className="section-small" />
            <SkeletonLine className="section-title medium" />
          </div>

          <SkeletonLine className="section-link" />
        </div>

        <div className="library-skeleton-grid">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <SkeletonCard key={index} />
            )
          )}
        </div>

      </section>


      {/* ==========================================
          SECTION 3
      ========================================== */}

      <section className="library-skeleton-section">

        <div className="library-skeleton-section-header">
          <div>
            <SkeletonLine className="section-small" />
            <SkeletonLine className="section-title" />
          </div>
        </div>

        <div className="library-skeleton-grid">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <SkeletonCard key={index} />
            )
          )}
        </div>

      </section>

    </div>
  );
}