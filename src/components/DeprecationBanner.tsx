export function DeprecationBanner() {
  return (
    <div
      role="alert"
      className="border-b-2 border-amber-500 bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-50"
    >
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="text-xl sm:text-2xl leading-none">
            ⚠️
          </span>
          <div className="space-y-1">
            <p className="text-base sm:text-xl font-bold">
              This project is no longer maintained.
            </p>
            <p className="text-sm sm:text-base">
              The data on this dashboard is stale and will not be updated. We
              recommend the{' '}
              <a
                href="https://codereview.withmartian.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2 hover:no-underline"
              >
                Martian Code Review Bench
              </a>{' '}
              instead — an independent, open-source benchmark for AI code review
              tools (
              <a
                href="https://github.com/withmartian/code-review-benchmark"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2 hover:no-underline"
              >
                source
              </a>
              ).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
