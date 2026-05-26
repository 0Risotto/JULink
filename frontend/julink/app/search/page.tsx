"use client";

import { useSearch, SearchTab } from "@/domain/search/hooks/useSearch";
import UserSearchItem from "@/domain/search/components/UserSearchItem";
import PostSearchItem from "@/domain/search/components/PostSearchItem";
import HashtagSearchItem from "@/domain/search/components/HashtagSearchItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, Loader2 } from "lucide-react";

export default function SearchPage() {
  const {
    query,
    setQuery,
    activeTab,
    setActiveTab,
    loading,
    error,
    allData,
    usersData,
    postsData,
    hashtagsData,
  } = useSearch();

  const tabs: { label: string; value: SearchTab }[] = [
    { label: "All", value: "all" },
    { label: "Users", value: "users" },
    { label: "Posts", value: "posts" },
    { label: "Hashtags", value: "hashtags" },
  ];

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground">Find users, posts, and hashtags.</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-10 h-11"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.value)}
            className="flex-shrink-0"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {loading && (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-destructive p-4 border rounded-lg bg-destructive/10">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ALL TAB */}
            {activeTab === "all" && allData && (
              <div className="flex flex-col gap-6">
                {allData.users?.content.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Users</h2>
                    <div className="flex flex-col gap-2">
                      {allData.users.content.slice(0, 3).map((u) => (
                        <UserSearchItem key={u.id} user={u} />
                      ))}
                    </div>
                  </div>
                )}
                {allData.hashtags?.content.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Hashtags</h2>
                    <div className="flex flex-col gap-2">
                      {allData.hashtags.content.slice(0, 3).map((h) => (
                        <HashtagSearchItem key={h.hashtagId} hashtag={h} />
                      ))}
                    </div>
                  </div>
                )}
                {allData.posts?.content.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Posts</h2>
                    <div className="flex flex-col gap-2">
                      {allData.posts.content.slice(0, 5).map((p) => (
                        <PostSearchItem key={p.postId} post={p} />
                      ))}
                    </div>
                  </div>
                )}
                
                {allData.users?.content.length === 0 &&
                 allData.hashtags?.content.length === 0 &&
                 allData.posts?.content.length === 0 && (
                   <p className="text-muted-foreground text-center py-8">No results found.</p>
                 )}
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && usersData && (
              <div>
                {usersData.content.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {usersData.content.map((u) => (
                      <UserSearchItem key={u.id} user={u} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No users found.</p>
                )}
              </div>
            )}

            {/* POSTS TAB */}
            {activeTab === "posts" && postsData && (
              <div>
                {postsData.content.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {postsData.content.map((p) => (
                      <PostSearchItem key={p.postId} post={p} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No posts found.</p>
                )}
              </div>
            )}

            {/* HASHTAGS TAB */}
            {activeTab === "hashtags" && hashtagsData && (
              <div>
                {hashtagsData.content.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {hashtagsData.content.map((h) => (
                      <HashtagSearchItem key={h.hashtagId} hashtag={h} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No hashtags found.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}