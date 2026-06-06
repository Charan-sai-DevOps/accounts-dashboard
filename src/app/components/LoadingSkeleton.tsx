/**
 * Loading Skeleton Components
 * Addresses issue 36: Display skeleton UI while loading (better UX than blank space)
 */

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

/**
 * Skeleton loader with pulsing animation
 * Shows placeholder while content loads
 */
function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '4px',
  className = '',
}: SkeletonProps) {
  const style = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  const radiusStyle =
    typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;

  return (
    <div
      style={{
        width: style,
        height: heightStyle,
        borderRadius: radiusStyle,
        background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite',
      }}
      className={className}
    >
      <style>{`
        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({ columnCount = 5 }: { columnCount?: number }) {
  return (
    <tr>
      {Array.from({ length: columnCount }).map((_, i) => (
        <td key={i} style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
          <Skeleton height={20} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton for card layouts
 */
export function CardSkeleton() {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
      }}
    >
      <Skeleton height={24} width="60%" style={{ marginBottom: '12px' }} />
      <Skeleton height={16} width="100%" style={{ marginBottom: '8px' }} />
      <Skeleton height={16} width="80%" style={{ marginBottom: '16px' }} />
      <Skeleton height={40} width="100%" borderRadius={8} />
    </div>
  );
}

/**
 * Skeleton for user/avatar list items
 */
export function UserListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '8px',
            background: '#f8fafc',
          }}
        >
          <Skeleton width={40} height={40} borderRadius={20} />
          <div style={{ flex: 1 }}>
            <Skeleton height={16} width="60%" style={{ marginBottom: '8px' }} />
            <Skeleton height={14} width="80%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for charts/graphs
 */
export function ChartSkeleton() {
  return (
    <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px' }}>
      <Skeleton height={24} width="40%" style={{ marginBottom: '20px' }} />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '200px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            width={`${16.66}%`}
            height={`${Math.random() * 80 + 20}%`}
            borderRadius={4}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for dashboard grid
 */
export function DashboardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for list with header
 */
export function ListWithHeaderSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Skeleton height={32} width="40%" />
      </div>
      <UserListSkeleton count={3} />
    </div>
  );
}

/**
 * Skeleton for form layout
 */
export function FormSkeleton({ fieldCount = 4 }: { fieldCount?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i}>
          <Skeleton height={16} width="30%" style={{ marginBottom: '8px' }} />
          <Skeleton height={40} width="100%" borderRadius={8} />
        </div>
      ))}
      <Skeleton height={44} width="100%" borderRadius={8} style={{ marginTop: '8px' }} />
    </div>
  );
}

/**
 * Skeleton for page header
 */
export function PageHeaderSkeleton() {
  return (
    <div style={{ marginBottom: '24px' }}>
      <Skeleton height={40} width="50%" style={{ marginBottom: '12px' }} />
      <Skeleton height={16} width="100%" style={{ marginBottom: '8px' }} />
      <Skeleton height={16} width="80%" />
    </div>
  );
}

/**
 * Wrapper component to conditionally show skeleton or content
 */
interface WithSkeletonProps {
  isLoading: boolean;
  skeleton: React.ReactElement;
  children: React.ReactElement;
}

export function WithSkeleton({ isLoading, skeleton, children }: WithSkeletonProps) {
  return isLoading ? skeleton : children;
}

// Export base Skeleton for custom usage
export { Skeleton };
