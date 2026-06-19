export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="h-2.5 w-2.5 rounded-full bg-ink/20 animate-bounce"
            style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}
