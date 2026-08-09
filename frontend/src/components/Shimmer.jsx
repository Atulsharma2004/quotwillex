const Bone = ({ className = "", onBrand = false }) => (
  <div
    className={`${onBrand ? "shimmer-bone-on-brand" : "shimmer-bone"} ${className}`}
    aria-hidden
  />
);

export const QuoteCardSkeleton = () => (
  <div
    className="shimmer-card border border-blue-100 px-4 py-4 my-2 w-3/4 mx-auto rounded-lg bg-white/80 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
    aria-hidden
  >
    <div className="flex items-center gap-3 px-2 mb-4">
      <Bone className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Bone className="h-3.5 w-32 rounded-md" />
        <Bone className="h-2.5 w-20 rounded-md" />
      </div>
      <Bone className="h-7 w-16 rounded-full" />
    </div>
    <div className="space-y-2.5 px-2 mb-5">
      <Bone className="h-3.5 w-full rounded-md" />
      <Bone className="h-3.5 w-[92%] rounded-md" />
      <Bone className="h-3.5 w-3/4 rounded-md" />
    </div>
    <div className="flex items-center gap-3 px-2">
      <Bone className="h-8 w-14 rounded-lg" />
      <Bone className="h-8 w-14 rounded-lg" />
      <Bone className="h-8 w-20 rounded-lg" />
    </div>
  </div>
);

export const QuoteFeedSkeleton = ({ count = 4 }) => (
  <div className="space-y-1" role="status" aria-label="Loading quotes" aria-busy="true">
    {Array.from({ length: count }, (_, i) => (
      <QuoteCardSkeleton key={i} />
    ))}
  </div>
);

export const QotdSkeleton = ({ compact = false }) => (
  <div
    className={`qotd-card-v2 relative mx-auto overflow-hidden ${
      compact ? "max-w-xl" : "max-w-lg"
    }`}
    role="status"
    aria-label="Loading quote of the day"
    aria-busy="true"
  >
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Bone className="h-6 w-32 rounded-full" />
        <Bone className="h-7 w-16 rounded-full" />
      </div>
      <div className="mb-4 space-y-2">
        <Bone className="h-4 w-full rounded-md" />
        <Bone className="h-4 w-[90%] rounded-md" />
        <Bone className="h-4 w-2/3 rounded-md" />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div className="flex items-center gap-2.5">
          <Bone className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <Bone className="h-3 w-24 rounded-md" />
            <Bone className="h-2.5 w-20 rounded-md" />
          </div>
        </div>
        <Bone className="h-3 w-16 rounded-md" />
      </div>
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div
    className="max-w-3xl mx-auto px-4 py-8"
    role="status"
    aria-label="Loading profile"
    aria-busy="true"
  >
    <div className="shimmer-card relative mx-auto w-[92%] max-w-4xl overflow-hidden rounded-2xl border border-blue-100 shadow-lg dark:border-slate-700">
      <div className="bg-gradient-to-br from-blue-600/80 via-blue-500/70 to-indigo-600/80 px-6 sm:px-10 pt-10 pb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <Bone
            onBrand
            className="h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-full border-4 border-white/30"
          />
          <div className="flex-1 w-full space-y-3 text-center sm:text-left">
            <Bone onBrand className="mx-auto sm:mx-0 h-3 w-28 rounded-md" />
            <Bone onBrand className="mx-auto sm:mx-0 h-8 w-48 rounded-md" />
            <Bone onBrand className="mx-auto sm:mx-0 h-3 w-24 rounded-md" />
            <div className="flex justify-center sm:justify-start gap-6 pt-2">
              <Bone onBrand className="h-10 w-16 rounded-lg" />
              <Bone onBrand className="h-10 w-16 rounded-lg" />
              <Bone onBrand className="h-10 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-8">
      <QuoteFeedSkeleton count={3} />
    </div>
  </div>
);

const AwardsSlotSkeleton = ({ rank }) => (
  <article className={`awards-podium-slot awards-slot-${rank}`} aria-hidden>
    <Bone className="mb-2 mx-auto h-7 w-10 rounded-full" />
    <div className={`awards-block rank-${rank} !bg-transparent border border-slate-200/80 dark:border-slate-700`}>
      <Bone className="mb-3 h-3 w-6 rounded-md" />
      <div className="space-y-2 mb-4">
        <Bone className="h-3.5 w-full rounded-md" />
        <Bone className="h-3.5 w-[85%] rounded-md" />
        <Bone className="h-3.5 w-2/3 rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <Bone className={`rounded-full ${rank === 1 ? "h-11 w-11" : "h-9 w-9"}`} />
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-3 w-24 rounded-md" />
          <Bone className="h-2.5 w-16 rounded-md" />
        </div>
      </div>
      <Bone className="mt-3 h-6 w-24 rounded-full" />
    </div>
  </article>
);

export const AwardsSkeleton = () => (
  <div className="space-y-12" role="status" aria-label="Loading awards" aria-busy="true">
    {[0, 1, 2].map((section) => (
      <section key={section} className="awards-section">
        <div className="awards-section-head mb-4">
          <Bone className="h-5 w-5 rounded-md" />
          <Bone className="h-6 w-40 rounded-md" />
        </div>
        <div className="awards-podium-grid">
          <AwardsSlotSkeleton rank={2} />
          <AwardsSlotSkeleton rank={1} />
          <AwardsSlotSkeleton rank={3} />
        </div>
      </section>
    ))}
  </div>
);

export const FollowListSkeleton = ({ count = 5 }) => (
  <ul
    className="divide-y divide-gray-100 dark:divide-slate-700"
    role="status"
    aria-label="Loading users"
    aria-busy="true"
  >
    {Array.from({ length: count }, (_, i) => (
      <li key={i} className="flex items-center gap-3 px-4 py-3" aria-hidden>
        <Bone className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-3.5 w-32 rounded-md" />
          <Bone className="h-2.5 w-20 rounded-md" />
        </div>
        <Bone className="h-8 w-20 rounded-full" />
      </li>
    ))}
  </ul>
);

export const AuthCallbackSkeleton = () => (
  <div
    className="min-h-[50vh] flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 px-4"
    role="status"
    aria-label="Completing sign-in"
    aria-busy="true"
  >
    <Bone className="h-14 w-14 rounded-2xl" />
    <Bone className="h-4 w-56 rounded-md" />
    <Bone className="h-3 w-40 rounded-md" />
  </div>
);

export { Bone };
export default QuoteFeedSkeleton;
