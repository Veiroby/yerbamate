"use client";

type Props = {
  isFavorited: boolean;
  onToggle: (e: React.MouseEvent) => void;
  className?: string;
};

export function ProductFavoriteHeart({ isFavorited, onToggle, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(e);
      }}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ${className}`}
    >
      {isFavorited ? (
        <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
    </button>
  );
}
