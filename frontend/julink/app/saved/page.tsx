import FavoritesFeed from "@/domain/posts/feed/FavoritesFeed";

export default function SavedPage() {
  return (
    <div className="max-w-6xl mx-auto w-full p-4 lg:p-8 flex justify-center gap-8">
      {/* Main Feed Column */}
      <div className="w-full max-w-[600px]">
        <FavoritesFeed />
      </div>
    </div>
  );
}