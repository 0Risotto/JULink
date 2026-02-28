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

== Functional requirements
The functional requirements are shown in @Requirements_list
#figure(
  caption: [Requirements list],
  table(
    columns: (1fr, 2.4fr, 4fr, 1fr, 1fr, 1.5fr),

    [FR ID],[Requirement],[Description],[ST],[PR],
    [Increment],

    [FR 1],[User Registration],[The user shall be able to create an account by entering Username, University Email, First Name, Last Name, Password, Phone Number, College, Major, and an optional Profile Picture],[ST1, ST2],[5],[1],
  
    [FR 2],[Email OTP Verification],[The system shall send an OTP to the user's university email and verify it before completing registration],[ST1, ST2],[5],[1],
  
    [FR 3],[Login],[The user shall be able to log in using their Username or Email and Password],[ST1, ST2],[5],[1],
  
    [FR 4],[Two-Factor Authentication],[The system shall allow users to enable or disable optional two-factor authentication (2FA) during login],[ST1, ST2],[5],[1],

    [FR 5],[Forgot Password],[The user shall be able to reset their password by requesting a password reset link via email.],[ST1, ST2],[5],[1],
  
    [FR 6],[View Profile],[The user shall be able to view their profile containing Username, Name, Profile Picture, number of Posts, Followers, Following, College, Major, and optional Bio.],[ST1, ST2],[5],[2],

    [FR 7],[Edit Profile],[The user shall be able to edit their Username, Name, Bio, College, Major, and Profile Picture.],[ST1, ST2],[5],[2],
  
    [FR 8],[Share Profile],[The user shall be able to share their profile link with other users.],[ST1, ST2],[3],[2],  
  
    [FR 9],[Profile Navigation],[The user shall be able to navigate between their Own Posts and Reposts tabs on the profile page.],[ST1, ST2],[4],[2],

    [FR 10],[View Own Posts],[The user shall be able to view all posts they have personally created on their profile.],[ST1],[4],[2],
  
    [FR 11],[View Reposts],[The user shall be able to view all posts they have reposted on their profile.],[ST1, ST2],[4],[2],

    [FR 12],[Access Settings Menu],[The user shall be able to access the settings page to manage account preferences and configurations.],[ST1, ST2],[5],[3],

    [FR 13],[Account Privacy],[The user shall be able to switch their account privacy between public and private.],[ST1, ST2],[4],[3],
  
    [FR 14],[Change Name],[The user shall be able to change their displayed first and last name.],[ST1, ST2],[4],[3],
  
    [FR 15],[Edit Bio],[The user shall be able to update their profile bio.],[ST1, ST2],[3],[3],
  
    [FR 16],[Change Faculty/College],[The user shall be able to update their faculty or college information.],[ST1, ST2],[3],[3],

    [FR 17],[Change Password],[The user shall be able to securely change their account password.],[ST1, ST2],[4],[3],
  
    [FR 18],[Manage Saved Posts],[The user shall be able to view and manage their saved posts.],[ST1, ST2],[3],[3],
  
    [FR 19],[Manage Blocked Users],[The user shall be able to view and unblock previously blocked accounts.],[ST1, ST2],[5],[3],

    [FR 20],[View User Comments],[The user shall be able to view all comments they have previously written across the platform.],[ST1, ST2],[3],[3],
  
    [FR 21],[Logout],[The user shall be able to log out from their account.],[ST1, ST2],[5],[3],

    [FR 22],[Delete Account],[The user shall be able to permanently delete their account and all associated data.],[ST1, ST2, ST3],[4],[3],
  
    [FR 23],[Deactivate Account],[The user shall be able to temporarily deactivate their account, allowing reactivation later.],[ST1, ST2, ST3],[4],[3],

    [FR 24],[Theme Selection],[The user shall be able to choose between light mode and dark mode for the application.],[ST1, ST2],[3],[3],

    [FR 25],[Follow User],[The user shall be able to follow other users.],[ST1, ST2],[5],[4],
  
    [FR 26],[Unfollow User],[The user shall be able to unfollow any user they currently follow.],[ST1, ST2],[5],[4],

    [FR 27],[View Followers],[The user shall be able to view a list of all followers and search within that list.],[ST1, ST2],[4],[4],

    [FR 28],[View Following],[The user shall be able to view a list of all accounts they follow and search within that list.],[ST1, ST2],[4],[4],
    
    [FR 29],[Block User],[The user shall be able to block other users to stop interactions and visibility.],[ST1, ST2],[5],[4],

    [FR 30],[Report User],[The user shall be able to report another user for inappropriate or abusive behavior.],[ST1, ST2],[4],[4],

    [FR 31],[Group Chats],[Users should be able to create or join group chats.],[ST1, ST2],[3],[5],
  
    [FR 32],[Direct Messages],[Users shall be able to send and receive direct messages with other users.],[ST1, ST2],[5],[5],

    [FR 33],[Video Calling],[Users shall be able to initiate and receive video calls with other users.],[ST1, ST2],[2],[5],

    [FR 34],[Lost and Found Posts],[Users shall be able to create and view lost-and-found posts for items or announcements.],[ST1, ST2],[3],[6],

    [FR 35],[Create Post],[Users shall be able to create and publish posts containing text and/or media.],[ST1],[5],[6],

    [FR 36],[View Feed Posts],[The user shall be able to view the post feed containing posts from followed users and recommended posts.],[ST1, ST2],[5],[6],
    
    [FR 37],[Like Post],[The user shall be able to like any post visible to them.],[ST1, ST2],[4],[6],

    [FR 38],[Unlike Post],[The user shall be able to remove their like from any post they previously liked.],[ST1, ST2],[4],[6],

    [FR 39],[Comment on Post],[The user shall be able to add comments to posts.],[ST1, ST2],[4],[6],
  
    [FR 40],[Delete Post],[The user shall be able to delete any of their own posts.],[ST1, ST2],[5],[6],

    [FR 41],[Share Post],[The user shall be able to share existing posts with other users inside the platform.],[ST1, ST2],[4],[6],  
  
    [FR 42],[Report Post],[The user shall be able to report posts for inappropriate or harmful content.],[ST1, ST2],[4],[6],
  
    [FR 43],[Save Post],[The user shall be able to save any post for later viewing.],[ST1, ST2],[4],[6],
    
    [FR 44],[Repost],[The user shall be able to repost content so that it appears on their profile or feed.],[ST1],[3],[6],
  
    [FR 45],[Manage Comments],[The user shall be able to view and delete comments on their posts and optionally limit who can comment.],[ST1, ST2],[3],[6],
    
    [FR 46],[Post Recommendations],[The system shall recommend posts to users based on their interests, interactions, and following behavior.],[ST1, ST2],[3],[7],


    [FR 47],[Display Ads on Feed],[The user shall be able to view ads on their feed page.],[ST1, ST2, ST4],[3],[8],

    [FR 48],[Clickable Ads],[The user shall be able to click on an ad that will take them to the ad provider website.],[ST1, ST2, ST4],[3],[8],

    [FR 49],[Report Ad],[The user shall be able to report an advertisement that is NSFW or inappropriate.],[ST1, ST2, ST4],[3],[8],
  
  )
)<Requirements_list>
