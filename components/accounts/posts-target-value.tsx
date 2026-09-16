// Shows "Soll / Ist" for the Posts stat card: Soll (target) is currently a
// fixed placeholder — it becomes admin/employee-editable once the
// Mitarbeiterportal exists to author it. Ist (actual) is the tracked count
// for the selected range, colored green when it meets or beats the target.
export function PostsTargetValue({
  target = 0,
  actual,
}: {
  target?: number;
  actual: number;
}) {
  const onTrack = actual >= target;
  return (
    <span className="tabular-nums">
      <span className="text-muted-foreground" title="Soll">
        {target}
      </span>
      <span className="text-muted-foreground"> / </span>
      <span
        className={onTrack ? "text-emerald-500" : "text-destructive"}
        title="Ist"
      >
        {actual}
      </span>
    </span>
  );
}
