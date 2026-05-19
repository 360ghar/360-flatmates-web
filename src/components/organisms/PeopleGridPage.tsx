import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProfileGridCard } from "@/components/molecules/ProfileGridCard";

import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";

export interface PeopleGridPageProps<T> {
  title: string;
  subtitle: string;
  query: {
    data: T[] | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
  emptyTitle: string;
  emptyDescription: string;
  ctaLabel: string;
  getPeerId: (item: T) => string;
  getProfileProps: (item: T) => React.ComponentProps<typeof ProfileGridCard>["profile"];
}

export function PeopleGridPage<T>({
  title,
  subtitle,
  query,
  emptyTitle,
  emptyDescription,
  ctaLabel,
  getPeerId,
  getProfileProps,
}: PeopleGridPageProps<T>) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center gap-3">
        <Button variant="icon" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">{title}</h1>
      </div>

      <p className="text-body-md text-ink-2">{subtitle}</p>

      <AsyncView
        data={query.data ?? []}
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={(data) => data.length === 0}
        loading={<Skeleton variant="profileGridCard" count={6} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" />}
        empty={
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
          />
        }
        onRetry={() => query.refetch()}
      >
        {(data) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((item, i) => {
              const peerId = getPeerId(item);
              const profile = getProfileProps(item);
              return (
                <div key={peerId} className="card-appear"
                    style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                  <ProfileGridCard
                    profile={profile}
                    ctaLabel={ctaLabel}
                    onOpen={(id) => navigate(`/profile/${id}`)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </AsyncView>
    </div>
  );
}
