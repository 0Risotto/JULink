#let chapter-number = 7

#show figure.where(kind: image): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure: set block(breakable: true)
#show figure.where(kind: table): set figure.caption(position: top)

#set table(
  fill: (x, y) => if y == 0 { rgb("#2F5496") } else { none },
)
#show table.cell.where(y: 0): set text(fill: white, weight: "bold")

// Base path for the screenshots
#let shot(file) = "../../assets/User Manual/" + file

= User Manual

This manual explains how to use JULink, the social platform for the University of Jordan community. It is written for end users — students, faculty, and staff — and walks through each feature with the matching screenshot. To use JULink you need a valid university email address (ending in `@ju.edu.jo`) and a modern web browser.

== Creating an Account

New users register from the *Register* screen (@um_register). Enter a username, your university email, your first and last name, select your faculty, and choose a password (then repeat it). Selecting *Register* creates the account and sends a verification code to your university email; the account remains inactive until that code is confirmed. Existing users can return to the sign-in screen with *Back to Login*.

#figure(
  caption: [Creating a new JULink account on the Register screen],
  image(shot("Register.jpeg"), width: 100%),
)<um_register>

== Logging In

On the *Login* screen (@um_login) enter your username or university email together with your password, then select *Login*. The eye icon reveals the password so you can check it before submitting. If you do not yet have an account, *Register* opens the sign-up screen, and *Forgot password?* begins password recovery.

#figure(
  caption: [The JULink login screen],
  image(shot("login.jpeg"), width: 100%),
)<um_login>

== Resetting a Forgotten Password

Selecting *Forgot password?* opens the *Reset Password* dialog (@um_forgot). Enter your JU student or staff email address and choose *Send Reset OTP*; the system emails a one-time code to that address.

#figure(
  caption: [Requesting a password-reset code],
  image(shot("Forgot-password.jpeg"), width: 100%),
)<um_forgot>

The dialog then asks for the code and a new password (@um_forgot_otp). Enter the *OTP Code* that was emailed to you, type your *New Password* (at least six characters) and repeat it under *Confirm Password*, then select *Reset Password*. *Back* returns to the previous step. Once the reset succeeds you can sign in with the new password.

#figure(
  caption: [Entering the reset code and choosing a new password],
  image(shot("Forgot-password-OTP.jpeg"), width: 100%),
)<um_forgot_otp>

== Navigating JULink

After signing in, the application uses a persistent menu on the left. The menu items are summarised in @um_nav. The unread notification count appears as a badge next to *Notifications*, sponsored ads sit at the bottom of the menu, and your account name and handle appear at the very bottom.

#figure(
  caption: [The main navigation menu],
  table(
    columns: (1fr, 3fr),
    [Menu item], [Purpose],
    [Home], [The main feed of posts from people you follow and recommended content],
    [Search], [Find users, posts, and hashtags],
    [Notifications], [Your real-time activity alerts, with an unread badge],
    [Chat], [Direct messages, group chats, and audio/video calls],
    [Lost & Found], [Report and browse lost or found items by college],
    [Settings], [Manage your account, privacy, blocked users, and theme],
  )
)<um_nav>

== The Home Feed & Interacting with Posts

The *Home* feed (@um_home) is the first screen after signing in. Each post shows its author, how long ago it was posted, any attached media, and a row of actions: the heart to like, the speech bubble to comment, the arrow to share, and the bookmark to save the post for later.

#figure(
  caption: [The Home feed],
  image(shot("Home.png"), width: 100%),
)<um_home>

Selecting a post opens it in an expanded view (@um_post_expand) with the media on one side and a comments panel on the other. The panel shows the author, the caption, the existing comments, the like count, and a *Write a comment...* box. 

#figure(
  caption: [A post opened in detail with its comments panel],
  image(shot("home-post-expand.png"), width: 100%),
)<um_post_expand>

By clicking the share icon, you can send the post directly to your friends or group chats (@um_post_share). A clickable preview thumbnail will be embedded inside the chat message.

#figure(
  caption: [Sharing a post to a direct message or group chat],
  image(shot("home-post-share.png"), width: 100%),
)<um_post_share>

If a post breaks the community guidelines, open the post's options menu (the "..." button in the top right corner) and choose *Report Post* (@um_post_report).

#figure(
  caption: [Opening the Report Post option from a post],
  image(shot("home-post-expand-report.png"), width: 100%),
)<um_post_report>

This opens the *Report post* dialog (@um_report_dialog). Choose a reason from the drop-down list, optionally add context under *Additional details* (up to 1000 characters), and select *Submit Report*.

#figure(
  caption: [The Report post dialog],
  image(shot("home-post-expand-report-expand.png"), width: 100%),
)<um_report_dialog>

== Searching

The *Search* screen (@um_search) finds users, posts, and hashtags. Type a query into the search box; results appear dynamically. 

#figure(
  caption: [The Search screen showing combined results],
  image(shot("search.png"), width: 100%),
)<um_search>

The tabs *All*, *Users*, *Posts*, and *Hashtags* let you focus on a single category. Selecting the *Users* tab restricts the results to matching people (@um_search_users), while the *Posts* tab lists matching posts (@um_search_posts). 

#figure(
  caption: [Search filtered to Users],
  image(shot("search-filter-users.png"), width: 100%),
)<um_search_users>

#figure(
  caption: [Search filtered to Posts],
  image(shot("search-filter-posts.png"), width: 100%),
)<um_search_posts>

The *Hashtags* tab lists matching tags (@um_search_hashtags), which can be selected to explore a dedicated feed of related posts.

#figure(
  caption: [Search filtered to Hashtags],
  image(shot("search-filter-hashtags.jpeg"), width: 100%),
)<um_search_hashtags>

== Notifications

The *Notifications* screen (@um_notifications) collects your real-time activity alerts. The header shows the number of unread items and a *Mark all as read* button. The tabs let you filter by category. Each alert can be clicked to jump directly to the relevant content, or removed with its trash icon.

#figure(
  caption: [The Notifications screen],
  image(shot("notifications.jpeg"), width: 100%),
)<um_notifications>

== Messaging and Chat

The *Chat* screen (@um_chat) lists your active direct messages and group conversations. 

#figure(
  caption: [The Chats list],
  image(shot("chat.jpeg"), width: 100%),
)<um_chat>

Use the plus icon to start a new direct message (@um_start_dm), or the group icon to create a new group chat (@um_start_group). You can only message mutual followers.

#figure(
  caption: [Initiating a new direct message],
  image(shot("chat-start-dm.png"), width: 100%),
)<um_start_dm>

#figure(
  caption: [Creating a new group chat],
  image(shot("chat-start-group.png"), width: 100%),
)<um_start_group>

Opening a conversation shows the message history (@um_chat_dm). Type into the *Message...* box to send text, use the paperclip to attach files, and use the microphone to record voice messages.

#figure(
  caption: [A direct-message conversation],
  image(shot("chat-dm.png"), width: 100%),
)<um_chat_dm>

You can modify or recall your own messages using the *Edit* or *Delete* options (@um_chat_edit). If you receive an inappropriate message, you can also flag it via the *Report* option (@um_chat_report).

#figure(
  caption: [Editing or deleting your own message],
  image(shot("chat-dm-edit-remove.png"), width: 100%),
)<um_chat_edit>

#figure(
  caption: [Reporting a chat message],
  image(shot("chat-dm-report.png"), width: 100%),
)<um_chat_report>

Inside a group chat (@um_chat_group), the administrator can access the *Group Config* panel (@um_chat_group_config) to change the group name, update the group picture, manage admins, or remove members.

#figure(
  caption: [A Group Chat conversation],
  image(shot("chat-group.png"), width: 100%),
)<um_chat_group>

#figure(
  caption: [Group Chat configuration panel],
  image(shot("chat-group-config.png"), width: 100%),
)<um_chat_group_config>

== Audio and Video Calls

Selecting the phone or camera icons in a chat header instantly initiates a live peer-to-peer call. The call opens in its own meeting interface (@um_call). The window provides standard meeting controls and can be minimized to keep browsing the platform.

#figure(
  caption: [An in-progress video call window],
  image(shot("call.jpeg"), width: 100%),
)<um_call>

== Campus Lost & Found

The *Lost & Found* section is a dedicated community board for tracking missing items (@um_lnf). Use the filters at the top to sort listings by "Lost", "Found", "Pending", or "Resolved", as well as filtering by specific university colleges.

#figure(
  caption: [The main Lost and Found feed],
  image(shot("lostandfounds.png"), width: 100%),
)<um_lnf>

Click the *Create Post* icon to submit a new item (@um_create_lnf), providing a description, image, college, and optional phone number.

#figure(
  caption: [Creating a new Lost & Found listing],
  image(shot("create-lost-and-found.png"), width: 100%),
)<um_create_lnf>

When viewing someone else's active post (@um_lnf_stranger), you can select the *Claim* button (@um_lnf_claim) to securely message the owner and coordinate the item's return.

#figure(
  caption: [Viewing a stranger's Lost & Found post],
  image(shot("lost-and-founds-stranger-post.png"), width: 100%),
)<um_lnf_stranger>

#figure(
  caption: [Submitting a claim request to the item owner],
  image(shot("lost-and-founds-claim-itempng.png"), width: 100%),
)<um_lnf_claim>

== User Profile Management

Clicking your name at the bottom of the navigation menu opens your personal *Profile* page (@um_profile). Here, you can view your biography, follower statistics, and create new posts directly from your timeline (@um_profile_add_post).

#figure(
  caption: [Your personal profile page],
  image(shot("prodile.jpeg"), width: 100%),
)<um_profile>

#figure(
  caption: [Adding a new post from the profile view],
  image(shot("profile-add-post.jpeg"), width: 100%),
)<um_profile_add_post>

Just like on the home feed, you can click on any post on your profile to open it in expanded view (@um_profile_post_expand). Use the tabs on your profile to switch between viewing your public *Posts*, items you have *Reposted*, and your private *Saved* bookmarks (@um_profile_saved).

#figure(
  caption: [Expanding a post from your profile],
  image(shot("profile-post-expand.jpeg"), width: 100%),
)<um_profile_post_expand>

#figure(
  caption: [Viewing your privately saved posts],
  image(shot("profile-saved-posts.jpeg"), width: 100%),
)<um_profile_saved>

You can also visit other users' profiles (@um_visiting_profile) to see their public posts, mutual friends, and to interact by following or sending a direct message.

#figure(
  caption: [Visiting another user's profile],
  image(shot("visiting-profile.jpeg"), width: 100%),
)<um_visiting_profile>

== Settings and Logging Out

The *Settings* menu (@um_settings) allows you to manage your platform preferences. You can update your display name, change your password, switch your theme between Light and Dark mode, toggle your account privacy, and view your blocked users list.

#figure(
  caption: [The Account Settings dashboard],
  image(shot("settings.jpeg"), width: 100%),
)<um_settings>

To securely exit the platform, click the arrows next to your name at the bottom of the navigation bar to open the quick-action menu, and select *Log out* (@um_logout).

#figure(
  caption: [Logging out of your account],
  image(shot("logout-nav.png"), width: 100%),
)<um_logout>