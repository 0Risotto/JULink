import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { UserCardProps } from "@/types/profile/userprofile"
import UserListDialog from "./UserList"

export default function UserCard({ user }: UserCardProps) {
  return (
    <div className="w-full flex flex-col border-b">
      
      {/* Banner */}
      <div 
        className="w-full h-40 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${user.bannerPhoto})` }}
      >
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="flex items-start gap-6 py-6 px-4">
        <Avatar className="w-24 h-24 -mt-12 border-0 border-white">
          <AvatarImage src={user.profilePicture} />
          <AvatarFallback>
            {user.firstName[0]}
            {user.lastName[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          {/* Username + Edit */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{user.username}</h1>
            <Button variant="outline">Edit Profile</Button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <p><span className="font-bold">{user.postsNumber}</span> Posts</p>
 
            <UserListDialog
              title="Followers"
              list={user.followers}
              trigger={
                <p className="cursor-pointer">
                  <span className="font-bold">{user.followers.length}</span> Followers
                </p>
              }
            />      

            <UserListDialog
              title="Following"
              list={user.followings}
              trigger={
                <p className="cursor-pointer">
                  <span className="font-bold">{user.followings.length}</span> Following
                </p>
              }
            />
          </div>

          {/* Full Name & College */}
          <div>
            <p className="font-semibold">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-muted-foreground">{user.college}</p>

            {user.bio && <p className="text-sm mt-1">{user.bio}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
