import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { FollowUser } from "@/types/profile/userprofile"

interface UserListDialogProps {
  title: string
  list: FollowUser[]
  trigger: React.ReactNode
}

export default function UserListDialog({ title, list, trigger }: UserListDialogProps) {
  const [search, setSearch] = useState("")

  const filtered = list.filter(user =>
    user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2"
        />

        {/* User List */}
        <div className="flex flex-col gap-4 max-h-80 overflow-y-auto mt-4">
          {filtered.map((u) => (
            <div key={u.username} className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={u.pfp} />
                <AvatarFallback>{u.fullName[0]}</AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <p className="font-medium">{u.fullName}</p>
                <p className="text-sm text-muted-foreground">@{u.username}</p>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
