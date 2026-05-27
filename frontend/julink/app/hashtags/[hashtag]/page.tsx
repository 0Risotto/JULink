import HashtagFeed from "@/domain/posts/feed/HashtagFeed";
import TrendingHashtags from "@/domain/posts/components/TrendingHashtags";

interface PageProps {
  params: {
    hashtag: string;
  };
}

export default function HashtagPage({ params }: PageProps) {
  // params.hashtag is already decoded, but just in case, we decode it.
  const decodedHashtag = decodeURIComponent(params.hashtag);

  return (
    <div className="max-w-6xl mx-auto w-full p-4 lg:p-8 flex justify-center gap-8">
      {/* Main Feed Column */}
      <div className="w-full max-w-[600px]">
        <HashtagFeed hashtagName={decodedHashtag} />
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-[300px] shrink-0">
        <div className="sticky top-8">
          <TrendingHashtags />
        </div>
      </div>
    </div>
  );
}