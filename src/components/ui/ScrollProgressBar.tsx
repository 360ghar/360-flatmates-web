import { useScrollProgress } from "@/hooks/useScrollProgress";

export function ScrollProgressBar() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  return (
    <>
      <div ref={ref} className="absolute inset-0 pointer-events-none" />
      <div className="scroll-progress-bar" style={{ width: `${progress * 100}%` }} />
    </>
  );
}
