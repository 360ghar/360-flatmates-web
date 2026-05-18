import { Link, type LinkProps } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchRouteQueries } from "@/lib/prefetch";

export function PrefetchLink({ to, ...props }: LinkProps) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    const pathname = typeof to === "string" ? to : to.pathname ?? "";
    prefetchRouteQueries(queryClient, pathname);
  };

  return <Link to={to} onMouseEnter={handleMouseEnter} {...props} />;
}
