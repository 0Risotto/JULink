import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostSearchResultDTO } from "../types";

interface Props {
  post: PostSearchResultDTO;
}

export default function PostSearchItem({ post }: Props) {
  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer mb-2">
      <div className="flex items-center gap-3">
        <Link href={`/${post.ownerUsername}`}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.ownerProfilePictureUrl || undefined} />
            <AvatarFallback>
              {post.ownerFirstName?.[0]}
              {post.ownerLastName?.[0]}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Link href={`/${post.ownerUsername}`} className="hover:underline">
          <p className="font-semibold text-sm">
            {post.ownerFirstName} {post.ownerLastName} <span className="text-muted-foreground font-normal text-xs">@{post.ownerUsername}</span>
          </p>
        </Link>
      </div>
      <p className="text-sm">{post.description}</p>
      <div className="text-xs text-muted-foreground mt-2">
        {new Date(post.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}