export interface Comment {
commenterPfp: string;
commenterUsername: string;
commentText: string;
likes: number;
date: string; 
}

export interface Post {
postMedia: string; 
mediaType: "image" | "video"; 
caption: string;
ownerUsername: string;
ownerPfp: string;
date: string; 
comments: Comment[];
}
    