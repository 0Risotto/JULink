import React from "react";
import UserCard from "./components/usercard/UserCard";
import { UserProfileData } from "@/dummydata/dummyuser";

export default function OwnProfile() {
  return (
    <div>
      <UserCard user={UserProfileData.user} />
    </div>
  )
}
