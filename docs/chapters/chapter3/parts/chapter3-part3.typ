#let chapter-number = 3

#show figure.where(kind: table): set figure(
  numbering: n => [#chapter-number.#"."#n],
)
#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)

#show figure: set block(breakable: true)

#show figure.where(
  kind: table,
): set figure.caption(position: top)


== Functional Requirements

The functional requirements are shown in @Requirements_list

#figure(
  caption: [Requirements list],
  table(
    columns: (1fr, 2.4fr, 4fr, 1fr, 1fr, 1.5fr),
    
    [FR ID], [Requirement], [Description], [ST], [PR], [Increment],

    [FR 1], [Create Account], [The user shall be able to create a new account by providing a unique username, full name, academic college, and a secure password. The system must restrict registration exclusively to users with a valid `@ju.edu.jo` university email address.], [ST1], [5], [1],

    [FR 2], [Request Verification Code], [The system shall send a 6-digit verification code to the user's university email during registration or password recovery. The user shall also have the ability to explicitly request a new code to be sent after a brief cooldown period.], [ST1], [5], [1],

    [FR 3], [Submit Verification Code], [The user shall be able to input their received 6-digit code to verify their identity. The system must enforce a 3-minute validity window on the code to successfully activate an account or authorize a password reset.], [ST1], [5], [1],

    [FR 4], [Log In to Account], [The user shall be able to securely log into the platform using either their registered username or their university email address, along with their password.], [ST1], [5], [1],

    [FR 5], [Reset Password], [The user shall be able to securely reset their password if forgotten. The system must first verify the user's identity through the email OTP process before permitting the creation of a new password.], [ST1], [5], [1],

    [FR 6], [Initialize Profile], [Upon their very first successful login, the user must be directed to a mandatory onboarding screen to initialize their profile. They must be able to upload a profile picture, a banner photo, write a short biography, and select a system-wide theme preference (Light, Dark, or System).], [ST1], [5], [2],

    [FR 7], [Upload Media], [The user shall be able to seamlessly select and upload image files for their profile and banner photos during the onboarding process and future profile edits.], [ST1], [4], [2],

    [FR 8], [Log Out of Session], [The user shall be able to securely terminate their active session via the navigation menu. The system must invalidate the user's authentication token and instantly redirect them to the public login screen.], [ST1], [5], [3],

    [FR 9], [Delete Account], [The user shall have the ability to permanently delete their account. The system must ensure a complete removal of the user's presence from the platform, including their profile data, posts, comments, media, and private messages.], [ST1], [5], [3],

    [FR 10], [View Own Profile], [The user shall be able to view their personal profile page, which displays their profile picture, banner photo, full name, college, biography, total post count, and follower/following statistics.], [ST1], [5], [2],

    [FR 11], [Navigate Profile Tabs], [The user shall be able to easily navigate between a tab displaying their own published posts and a private tab displaying their saved (favorited) posts directly from their profile page.], [ST1], [4], [2],

    [FR 12], [View Other Profiles], [The user shall be able to look up and view the public profiles of other users on the platform. The system must hide profiles and restrict access if either user has blocked the other.], [ST1], [5], [2],

    [FR 13], [Edit Profile Details], [The user shall be able to modify their profile details at any time via an edit interface. This includes updating their first name, last name, academic college, biography, and uploading new profile or banner images.], [ST1], [4], [2],

    [FR 14], [View Connection Lists], [The user shall be able to click on the follower or following counts on any profile to view a detailed, interactive list of the users belonging to those specific categories.], [ST1], [4], [4],

    [FR 15], [View Mutual Followers], [The user shall be able to see a summary of shared connections when viewing another user's profile, explicitly showing the exact count and names of mutual followers.], [ST1], [4], [4],

    [FR 16], [Message Friend], [When viewing the profile of a mutually followed user, the user shall be able to instantly open a private message chat via a direct shortcut button located within the profile header.], [ST1], [5], [5],

    [FR 17], [Toggle Follow Status], [The user shall be able to easily follow or unfollow other users on the platform to curate their social feed and manage their connections.], [ST1], [5], [4],

    [FR 18], [Search Connection Lists], [The user shall be able to view detailed lists of their followers, the accounts they are following, and their mutual friends. The user must also be able to search within these lists to quickly filter and locate specific accounts.], [ST1], [4], [4],

    [FR 19], [View Mutual Connections], [The user shall be able to view shared connections when visiting another user's profile, explicitly seeing the names and count of mutual followers to encourage networking.], [ST1], [4], [4],

    [FR 20], [Discover Friend Suggestions], [The user shall be presented with a curated list of personalized friend recommendations. The system must intelligently calculate these suggestions based on the user's current network and the number of mutual connections they share with other students.], [ST1], [4], [7],

    [FR 21], [Display Live Relationship Status], [The system shall dynamically update the interface to reflect the user's relationship status with others, seamlessly displaying "Follow," "Unfollow," or unlocking direct messaging capabilities for mutual follows.], [ST1], [5], [4],

    [FR 22], [Enforce Graph Privacy], [The system shall automatically respect user privacy settings by preventing users from following, being followed by, or appearing in the mutual lists and friend suggestions of any accounts they have actively blocked or been blocked by.], [ST1], [5], [4],

    [FR 23], [Report Lost or Found Items], [The user shall be able to publish detailed listings for items they have lost or found. The listing must include the type (Lost/Found), a description, multiple photos, the associated academic college, and an optional phone number for quick contact.], [ST1], [4], [6],

    [FR 24], [Browse and Filter Listings], [The user shall be able to browse a dedicated, continuous feed of all reported items. The interface must provide interactive filters allowing the user to instantly narrow down the feed by item type (Lost vs. Found), resolution status (Pending vs. Resolved), and specific university colleges.], [ST1], [4], [6],

    [FR 25], [Submit Claim Request], [The user shall be able to submit a formal "Claim" on an active listing. The system must prompt the user to write a custom message (e.g., providing proof of ownership) and securely deliver this request directly to the listing's owner.], [ST1], [4], [6],

    [FR 26], [Message Listing Owner], [The user shall be able to instantly open a private chat with an item's owner via a quick-access button on the listing to safely coordinate the item's return.], [ST1], [5], [6],

    [FR 27], [Mark Listing as Resolved], [The user shall be able to update their post's status to "Resolved" once an item has been successfully recovered or returned. The system must visually badge resolved items and prevent further claim requests on them.], [ST1], [4], [6],

    [FR 28], [Dispatch Localized Alerts], [The system shall automatically send a notification to all students belonging to a specific academic college whenever a new lost or found item is posted within that college, increasing the chances of item recovery.], [ST1], [3], [6],

    [FR 29], [Block User], [The user shall be able to block another account. Upon initiating a block, the system must automatically sever any existing follower or following relationships between the two users in both directions to ensure immediate privacy.], [ST1], [5], [3],

    [FR 30], [Unblock User], [The user shall be able to unblock a previously restricted account at any time, instantly restoring their ability to view profiles and interact normally on the platform.], [ST1], [5], [3],

    [FR 31], [View Blocked Accounts], [The user shall be able to navigate to a dedicated settings menu to view a chronological list of all the accounts they currently have blocked. This list must display the restricted user's full name, profile picture, and the exact date the block was enacted.], [ST1], [4], [3],

    [FR 32], [Enforce Global Blocking Constraints], [The platform must universally enforce active blocks across all features. If a block exists in either direction, the system shall strictly prevent both parties from viewing each other's profiles, exchanging messages, following, or appearing in each other's search results, mutual lists, and friend suggestions.], [ST1], [5], [3],

    [FR 33], [Create Posts], [The user shall be able to create and publish posts containing a text caption and a mixed gallery of up to 10 photos or videos seamlessly uploaded from their device.], [ST1], [5], [6],

    [FR 34], [Edit Posts], [The user shall be able to modify the text captions of their previously published posts.], [ST1], [5], [6],

    [FR 35], [Delete Posts], [The user shall be able to permanently delete their own posts, actively removing the content and associated media from the platform.], [ST1], [5], [6],

    [FR 36], [Browse Home Feed], [The user shall be able to scroll through a personalized, continuous home feed. The system must intelligently prioritize relevant posts (e.g., from followed peers or users in the same college) while actively filtering out content the user has already seen.], [ST1], [5], [7],

    [FR 37], [Toggle Post Likes], [The user shall be able to interact with posts by liking them, which dynamically updates the post's public engagement metrics. The user must also be able to reverse this action (unlike) at any time to remove their engagement.], [ST1], [4], [6],

    [FR 38], [Save Posts], [The user shall be able to securely save posts to a private, centralized bookmark list for easy retrieval at a later time.], [ST1], [4], [6],

    [FR 39], [Share Posts], [The user shall be able to share published posts directly into existing 1-on-1 or group chats, or generate a unique, shareable link to copy to their clipboard.], [ST1], [4], [6],

    [FR 40], [Navigate Media Carousels], [The user shall be able to swipe or click through posts containing multiple images or videos via an interactive carousel. The interface must provide standard playback and volume controls for video content.], [ST1], [4], [6],

    [FR 41], [Comment on Posts], [The user shall be able to leave top-level text comments on any visible post to participate in public discussions.], [ST1], [4], [6],

    [FR 42], [Reply to Comments], [The user shall be able to reply directly to existing comments on a post, creating a nested, hierarchical conversation thread.], [ST1], [4], [6],

    [FR 43], [Like Comments], [The user shall be able to like individual comments or replies to show agreement or engagement with other users' responses.], [ST1], [4], [6],

    [FR 44], [Edit Comments], [The user shall be able to modify the text of their own previously submitted comments or replies.], [ST1], [4], [6],

    [FR 45], [Delete Comments], [The user shall be able to permanently remove their own comments from a post's discussion thread.], [ST1], [4], [6],

    [FR 46], [Discover via Hashtags], [The system shall automatically detect hashtags typed within a post's caption and convert them into clickable links. Clicking a hashtag must allow the user to easily discover other posts related to that specific topic.], [ST1], [4], [6],

    [FR 47], [Report Content], [The user shall be able to flag and report inappropriate or harmful posts. The system must allow the user to submit a specific reason for the report to help administrators review the content.], [ST1], [4], [6],

    [FR 48], [Filter Inappropriate Media], [The system shall automatically analyze uploaded media for inappropriate or NSFW (Not Safe For Work) content during the upload process. If an inappropriate image or video is detected, the system must autonomously strip the offending media and seamlessly publish the post containing only the text description.], [ST1], [5], [6],

    [FR 49], [Display Ads on Feed], [The user shall be able to view ads dynamically placed within their feed page.], [ST1, ST3], [3], [8],

    [FR 50], [Clickable Ads], [The user shall be able to click on an ad that will take them seamlessly to the ad provider's external website.], [ST1, ST3], [3], [8],

    [FR 51], [Report Ad], [The user shall be able to explicitly report an advertisement if they determine it is NSFW or inappropriate for the platform.], [ST1, ST3], [3], [8],

    [FR 52], [Search Globally], [The user shall be able to enter a query into a master search bar to simultaneously search across the entire platform, returning a comprehensive summary of relevant users, posts, and hashtags.], [ST1], [5], [5],

    [FR 53], [Filter by Category], [The user shall be able to filter their search results by selecting dedicated category tabs (All, Users, Posts, Hashtags) to easily narrow down the type of content they are looking for.], [ST1], [5], [5],

    [FR 54], [Process Partial Queries], [The search engine must be highly forgiving, allowing users to successfully find peers or content even if they provide incomplete names or make minor spelling mistakes in their search query.], [ST1], [4], [5],

    [FR 55], [Display Live Results], [The system shall provide a dynamic search experience, automatically fetching and updating the search results in real-time as the user types their query, without requiring them to press a submit button.], [ST1], [4], [5],

    [FR 56], [Enforce Search Privacy], [The search system must actively respect all privacy settings. If a user has blocked someone, or has been blocked by them, that person must be completely hidden from all search results.], [ST1], [5], [5],

    [FR 57], [Discover via Hashtags], [The user shall be able to click on any hashtag across the platform to automatically trigger a dedicated search, displaying a feed of all posts associated with that specific topic.], [ST1], [4], [5],

    [FR 58], [Create Direct Messages], [The user shall be able to initiate private 1-on-1 conversations. The system must restrict conversation creation strictly to users who are mutual friends to prevent spam.], [ST1], [5], [5],

    [FR 59], [Create Group Chats], [The user shall be able to create multi-user group chats by selecting multiple mutual friends, automatically designating the creator as the group administrator.], [ST1], [5], [5],

    [FR 60], [Search Friends Real-Time], [The user shall be able to search their mutual friends list in real-time, with results updating instantly as they type, when starting a new DM or adding members to a group.], [ST1], [4], [5],

    [FR 61], [Send Text Messages], [The user shall be able to type and send standard text messages within any active 1-on-1 or group conversation.], [ST1], [5], [5],

    [FR 62], [Send Media and Files], [The user shall be able to upload and securely send documents (e.g., PDFs, Word files), photos, and videos directly into the chat timeline.], [ST1], [5], [5],

    [FR 63], [Record Voice Messages], [The user shall be able to record live audio using a built-in microphone tool and send it as a voice message within the chat.], [ST1], [4], [5],

    [FR 64], [Play Voice Messages], [The user shall be able to play received voice messages. The interface must feature a dynamic playback slider that tracks the duration in real-time, updating the remaining seconds as the audio plays.], [ST1], [4], [5],

    [FR 65], [Display Message Timestamps], [The system shall organize the chat timeline by displaying distinct, pill-shaped date and time dividers (e.g., "Yesterday, 17:27") between messages to clearly indicate when conversations occurred.], [ST1], [4], [5],

    [FR 66], [Display Typing Indicators], [The system shall display live, animated bouncing dots in real-time when another user in the conversation is actively composing a message.], [ST1], [4], [5],

    [FR 67], [Display Read Receipts], [The system shall display visual indicators (such as checkmarks) to explicitly show when a sent message has been delivered to and read by the recipient(s).], [ST1], [4], [5],

    [FR 68], [Edit Messages], [The user shall be able to modify the text of their own previously sent messages, appending an "(edited)" flag to the message metadata.], [ST1], [4], [5],

    [FR 69], [Delete Personal Messages], [The user shall be able to delete their own messages from a chat, replacing the original content with a visual placeholder stating the message was deleted.], [ST1], [4], [5],

    [FR 70], [Update Group Details], [A group administrator shall be able to edit the group chat's display name and upload a new group profile picture.], [ST1], [4], [5],

    [FR 71], [Add Group Members], [A group administrator shall be able to search for and invite additional mutual friends to an existing group chat.], [ST1], [4], [5],

    [FR 72], [Remove Group Members], [A group administrator shall be able to actively remove existing members from a group chat.], [ST1], [4], [5],

    [FR 73], [Manage Group Admins], [A group administrator shall be able to promote standard members to admin status, or demote existing admins back to standard members.], [ST1], [4], [5],

    [FR 74], [Leave Group], [The user shall be able to voluntarily leave a group chat at any time. If the user is the sole admin, the system must enforce delegation or restrict the action to prevent orphaned groups.], [ST1], [5], [5],

    [FR 75], [Share Posts to Chat], [The user shall be able to share published posts from the main feed directly into a chat. The system must render a neat, clickable thumbnail preview of the post within the message flow.], [ST1], [4], [5],

    [FR 76], [Initiate Calls from Chat], [The user shall be able to click dedicated header icons within the chat interface to instantly initiate a live audio or video call with the conversation participants.], [ST1], [5], [5],

    [FR 77], [Initiate Calls], [The user shall be able to initiate live audio-only or video calls directly from any 1-on-1 or group chat. The system must restrict calling capabilities exclusively to users who are mutual friends to prevent spam and harassment.], [ST1], [5], [5],

    [FR 78], [Display Incoming Call Alerts], [The system shall provide global, real-time notifications for incoming calls, playing an audible ringtone and displaying a pop-up alert with the caller’s name and profile picture, regardless of which page the user is currently viewing on the platform.], [ST1], [5], [5],

    [FR 79], [Accept Calls], [The user shall be able to accept an incoming call alert to instantly join the live video or audio meeting room.], [ST1], [4], [5],

    [FR 80], [Decline Calls], [The user shall be able to explicitly decline an incoming call, immediately dismissing the ringing alert and notifying the caller.], [ST1], [4], [5],

    [FR 81], [Cancel Outgoing Calls], [The caller shall be able to manually cancel an outgoing call attempt before the recipient answers it.], [ST1], [4], [5],

    [FR 82], [Timeout Unanswered Calls], [The system shall automatically terminate call attempts that ring for an extended period without being answered by the recipient.], [ST1], [4], [5],

    [FR 83], [Dispatch Missed Call Alerts], [The system shall automatically generate and deliver a "Missed Call" notification to the recipient if an incoming call times out or is canceled by the caller before being answered.], [ST1], [4], [5],

    [FR 84], [Minimize Call Window], [Upon accepting a call, the user shall be able to minimize the active video meeting into a floating, draggable Picture-in-Picture (PiP) window. This allows the user to continue browsing the platform while maintaining the live conversation.], [ST1], [4], [5],

    [FR 85], [Toggle In-Call Controls], [The active call interface shall provide standard meeting controls, allowing the user to seamlessly toggle their microphone (mute/unmute), toggle their camera on or off, switch to a grid/tile view for group calls, and safely hang up to leave the meeting.], [ST1], [5], [5],

    [FR 86], [Receive Real-Time Alerts], [The system shall deliver instant, live notifications to the user for various platform activities (e.g., likes, comments, follows, messages, and Lost & Found claims). The system must also integrate with the device's native browser to dispatch background push notifications.], [ST1], [5], [4],

    [FR 87], [Filter Notifications], [The user shall be able to access a centralized notification feed. To prevent clutter, the interface must automatically organize alerts into dedicated, filterable tabs (All, Interactions, Follows, Lost & Found, and Messages).], [ST1], [4], [4],

    [FR 88], [Preview Target Content], [The user shall be able to click any notification to be instantly redirected to the exact relevant context (a specific profile, chat, or item). For post-related interactions, the notification card must render a visual thumbnail preview of the original content.], [ST1], [5], [4],

    [FR 89], [Update Unread Status], [The client interface must display a dynamic badge indicating the total count of unread notifications. Users shall be able to manually mark individual alerts as read or use a bulk "Mark all as read" action. The system must also automatically clear unread message alerts the moment the user opens the corresponding chat.], [ST1], [4], [4],

    [FR 90], [Delete Notifications Manually], [The user shall have the ability to manually dismiss and delete specific notifications from their feed, allowing them to permanently clear unwanted alerts without needing to open them.], [ST1], [3], [4],

    [FR 91], [Auto-Delete Read Alerts], [The system shall automatically remove a notification from the user's feed the moment it is marked as read or clicked, ensuring the notification hub acts as an ephemeral inbox that only displays pending, unread alerts.], [ST1], [4], [4],

    [FR 92], [Report Platform Entities], [The user shall be able to report various entities across the platform, including other user profiles, specific feed posts, and individual chat messages, if they violate community guidelines.], [ST1], [5], [7],

    [FR 93], [Submit Report Reason], [The user shall be required to provide a custom written description detailing exactly why the content or user is being flagged when initiating a report.], [ST1], [4], [7],

    [FR 94], [Restrict Message Reporting], [The system must strictly enforce privacy constraints for direct messages, only permitting a user to report a chat message if they are an active, authorized participant in that specific conversation.], [ST1], [5], [7],

    [FR 95], [Escalate Reports Securely], [The system shall securely capture the submitted report—including the exact timestamp, the reporter's identity, the offending content, and the custom reason—and log it into a centralized place for administrative review.], [ST1, ST2], [5], [7],

    [FR 96], [Navigate Across Devices], [The system shall dynamically adapt the navigation interface to the user's device, presenting a persistent side menu for desktop users and an optimized bottom navigation bar for mobile users to access core platform features.], [ST1], [5], [2],

    [FR 97], [Display Notification Badges], [The system shall display a real-time, interactive badge within the global navigation menu indicating the user's current number of unread notifications, keeping them informed across all pages.], [ST1], [4], [4],

    [FR 98], [Access Settings Dashboard], [The user shall be able to navigate to a centralized settings dashboard to manage their application settings and account preferences.], [ST1], [4], [2],

    [FR 99], [Synchronize Theme Preferences], [The system shall automatically save and synchronize the user's selected UI theme (Light, Dark, or System) across any device they log into, ensuring a consistent viewing experience.], [ST1], [3], [2],

  )
) <Requirements_list>
