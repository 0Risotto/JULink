import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSearchResultDTO } from "../types";
import { Colleges } from "@/domain/auth/types";

interface Props {
  user: UserSearchResultDTO;
}

export default function UserSearchItem({ user }: Props) {
  // @ts-ignore
  const collegeName = Colleges[user.college] || user.college;

  return (
    <Link href={`/${user.username}`}>
      <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer mb-2">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.profilePictureUrl || undefined} />
          <AvatarFallback>
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <p className="text-muted-foreground text-xs">@{user.username}</p>
          {collegeName && <p className="text-muted-foreground text-xs">{collegeName}</p>}
        </div>
      </div>
    </Link>
  );
}