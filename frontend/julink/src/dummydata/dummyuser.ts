import type { Post } from "@/types/posts/post";
import type { UserProfileProps } from "@/types/profile/userprofile";

export const UserProfileData:UserProfileProps = {
user:{  username: "Anas04",
  firstName: "Anas",
  lastName: "Jallad",
  college: "King Abdullah II School of Information Technology",
  bio :"Hello world",
  profilePicture: "https://picsum.photos/200",

  followings: [
    { username: "alex99", fullName: "Alex Carter", pfp: "https://picsum.photos/201" },
    { username: "sara_k", fullName: "Sara Kim", pfp: "https://picsum.photos/202" }
  ],

  followers: [
    { username: "michael_b", fullName: "Michael Brown", pfp: "https://picsum.photos/203" },
    { username: "luna_s", fullName: "Luna Singh", pfp: "httpsum.photos/204" },
    { username: "sara_k", fullName: "Sara Kim", pfp: "https://picsum.photos/202" }

  ],
  bannerPhoto: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.donbishopstudio.com%2Fuploads%2F5%2F4%2F8%2F3%2F5483466%2Fs206769431343892363_p527_i18_w1988.jpeg&f=1&nofb=1&ipt=f025b22a5cdf0cee80e569debec5fc56b6c219aeec4500d1dccb4c98fcd56eces",
      get postsNumber() {
      return UserProfileData.posts.length;
    },
},
  posts:[] as Post[],

};