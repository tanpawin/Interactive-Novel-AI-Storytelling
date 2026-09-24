export default function AdminLoading() {
  return (
    <main className="admin-page">
      <div className="admin-container">
        <header className="admin-page-header">
          <div>
            <div className="admin-skeleton admin-dashboard-skeleton-label" />

            <div className="admin-skeleton admin-dashboard-skeleton-title" />

            <div className="admin-skeleton admin-dashboard-skeleton-description" />
          </div>
        </header>

        <section className="admin-dashboard-stats">
          <DashboardStatSkeleton />
          <DashboardStatSkeleton />
          <DashboardStatSkeleton />
          <DashboardStatSkeleton />
        </section>

        <section className="admin-section">
          <div className="admin-dashboard-skeleton-section-title">
            <div className="admin-skeleton admin-dashboard-skeleton-heading" />

            <div className="admin-skeleton admin-dashboard-skeleton-subheading" />
          </div>

          <div className="admin-menu-grid">
            <DashboardMenuSkeleton />
            <DashboardMenuSkeleton />
          </div>
        </section>

        <section className="admin-dashboard-overview">
          <DashboardOverviewSkeleton />
          <DashboardOverviewSkeleton />
          <DashboardOverviewSkeleton />
        </section>

        <section className="admin-dashboard-breakdown">
          <div>
            <div className="admin-skeleton admin-dashboard-skeleton-heading" />

            <div className="admin-skeleton admin-dashboard-skeleton-subheading" />
          </div>

          <div className="admin-dashboard-breakdown-grid">
            <DashboardBreakdownSkeleton />
            <DashboardBreakdownSkeleton />
            <DashboardBreakdownSkeleton />
            <DashboardBreakdownSkeleton />
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardStatSkeleton() {
  return (
    <div className="admin-stat-card">
      <div className="admin-skeleton admin-dashboard-skeleton-stat-icon" />

      <div className="admin-stat-content">
        <div className="admin-skeleton admin-dashboard-skeleton-stat-label" />

        <div className="admin-skeleton admin-dashboard-skeleton-stat-value" />
      </div>
    </div>
  );
}

function DashboardMenuSkeleton() {
  return (
    <div className="admin-menu-card admin-dashboard-menu-skeleton">
      <div className="admin-skeleton admin-dashboard-skeleton-menu-icon" />

      <div className="admin-menu-content">
        <div className="admin-skeleton admin-dashboard-skeleton-menu-title" />

        <div className="admin-skeleton admin-dashboard-skeleton-menu-description" />

        <div className="admin-skeleton admin-dashboard-skeleton-menu-link" />
      </div>
    </div>
  );
}

function DashboardOverviewSkeleton() {
  return (
    <div className="admin-dashboard-overview-card">
      <div>
        <div className="admin-skeleton admin-dashboard-skeleton-overview-label" />

        <div className="admin-skeleton admin-dashboard-skeleton-overview-value" />
      </div>

      <div className="admin-skeleton admin-dashboard-skeleton-overview-description" />
    </div>
  );
}

function DashboardBreakdownSkeleton() {
  return (
    <div className="admin-dashboard-breakdown-item">
      <div className="admin-skeleton admin-dashboard-skeleton-breakdown-label" />

      <div className="admin-skeleton admin-dashboard-skeleton-breakdown-value" />
    </div>
  );
}