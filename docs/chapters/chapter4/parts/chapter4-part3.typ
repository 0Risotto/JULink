#counter(figure.where(kind: table)).update(0)

#let chapter-number = 4
#show figure.where(kind: table): set figure(
  numbering: n => [#chapter-number.#"."#n],
)
#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure.where(kind: image): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)

#show figure.where(
  kind: table,
): set figure.caption(position: top)


#set table(
  fill: (x, y) => if x == 0 { rgb("#2F5496") },
)

#show table.cell.where(x: 0): set text(fill: white, weight: "bold")


== Use case and Sequence diagrams

#figure(
  caption: [Sign up and verify OTP use case diagram],
  image("../../../assets/Use case diagrams/1-5/Sign up + verify OTP use case.svg"),
)
#figure(
  caption: [Sign up use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Sign up use case scenario],
    [Actors], [Active users & passive users],
    [Description],
    [A user shall be able to create an account by entering Username, University Email, First Name, Last Name, Password, Phone Number, College, Major, and an optional Profile Picture.],
    [Data], [Registration details (username, email, name, password, phone, college, major, optional profile picture)],
    [Stimulus], [User selects Register and submits the registration form],
    [Response], [The system validates inputs and creates a new user account.],
    [Comment], [Registration enables the user to access  platform features that require an account.],
  ),
)

#figure(
  caption: [Email OTP Verification use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Email OTP Verification use case scenario],

    [Actors], [Active users & passive users],
    [Description],
    [The system shall send an OTP to the user’s university email and verify it before completing registration.],
    [Data], [University email, OTP code, verification status],
    [Stimulus], [User requests verification / enters the received OTP],
    [Response], [The system verifies the OTP and activates the user account if the OTP is valid.],
    [Comment], [Email verification ensures account authenticity and reduces fake registrations.],
  ),
)

#figure(
  caption: [User Registration sequence diagram],
  image("../../../assets/Sequence diagrams/1-5/User Registration sequence.svg"),
)
#figure(
  caption: [Email OTP Verification sequence diagram],
  image("../../../assets/Sequence diagrams/1-5/Email OTP Verification sequnce.svg"),
)
#pagebreak()

#figure(
  caption: [Login use case diagram],
  image("../../../assets/Use case diagrams/1-5/Login use case.svg"),
)
#figure(
  caption: [Login use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Login use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to log in using their Username or Email and Password.],
    [Data], [Username/Email, password, session token],
    [Stimulus], [User submits login credentials],
    [Response], [The system authenticates the user and starts a session if the credentials are correct.],
    [Comment], [Login allows users to access protected features such as posting and messaging.],
  ),
)

#figure(
  caption: [Login sequence diagram],
  image("../../../assets/Sequence diagrams/1-5/Login sequence.svg"),
)
#pagebreak()

#figure(
  caption: [Two-Factor Authentication use case diagram],
  image("../../../assets/Use case diagrams/1-5/Two factor authentication use case.svg"),
)
#figure(
  caption: [Two-Factor Authentication use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Two-Factor Authentication use case scenario],

    [Actors], [Active users & passive users],
    [Description],
    [The system shall allow users to enable or disable optional two-factor authentication (2FA) during login.],
    [Data], [2FA status (enabled/disabled), OTP code / verification method],
    [Stimulus], [User enables 2FA in settings or attempts login with 2FA enabled],
    [Response], [If 2FA is enabled, the system requests a second verification step before granting access.],
    [Comment], [2FA increases account security against password compromise.],
  ),
)

#figure(
  caption: [Two-Factor Authentication sequence diagram],
  image("../../../assets/Sequence diagrams/1-5/Two-Factor Authentication sequence.svg"),
)
#pagebreak()

#figure(
  caption: [Forgot Password use case scenario],
  image("../../../assets/Use case diagrams/1-5/Forgot Password use case.svg"),
)

#figure(
  caption: [Forgot Password use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Forgot Password use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to reset their password by requesting a password reset link via email.],
    [Data], [Email/username, reset token/link, new password],
    [Stimulus], [User selects Forgot Password and submits their email/username],
    [Response], [The system sends a password reset link and allows the user to set a new password.],
    [Comment], [Password recovery helps users regain access securely without creating a new account.],
  ),
)

#figure(
  caption: [Forgot Password sequence diagram],
  image("../../../assets/Sequence diagrams/1-5/Forgot Password sequence.svg"),
)
#pagebreak()
#figure(
  caption: [View Profile use case diagram],
  image("../../../assets/Use case diagrams/6-10/View Profile use case.svg", height: 20%, fit: "contain"),
)

#figure(
  caption: [View Profile use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[View Profile use case scenario],

    [Actors], [Active users & passive users],
    [Description],
    [The user shall be able to view their profile containing Username, Name, Profile Picture, number of Posts, Followers, Following, College, Major, and optional Bio.],
    [Data], [User profile data (username, name, profile picture, counts, college, major, bio)],
    [Stimulus], [User opens a profile page],
    [Response], [The system retrieves and displays the user’s profile information.],
    [Comment], [Viewing profiles helps users identify others and understand their activity on the platform.],
  ),
)
#figure(
  caption: [View Profile sequence diagram],
  image("../../../assets/Sequence diagrams/6-10/View Profile sequence.svg"),
)

#figure(
  caption: [Edit Profile use case diagram],
  image("../../../assets/Use case diagrams/6-10/Edit Profile use case .svg"),
)
#figure(
  caption: [Edit Profile use case scenario],
  table(

    columns: 2,

    table.cell(colspan: 2)[Edit Profile use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to edit their Username, Name, Bio, College, Major, and Profile Picture.],
    [Data], [Updated profile fields (username, name, bio, college, major, profile picture)],
    [Stimulus], [User selects Edit Profile, updates fields, and saves changes],
    [Response], [The system validates the updated information and saves the changes to the user profile.],
    [Comment], [Editing the profile allows users to keep their information accurate and up to date.],
  ),
)

#figure(
  caption: [Edit Profile sequence diagram],
  image("../../../assets/Sequence diagrams/6-10/Edit Profile sequence.svg"),
)
#figure(
  caption: [Share Profile use case diagram],
  image("../../../assets/Use case diagrams/6-10/Share Profile use case.svg", height: 25%, fit: "contain"),
)
#figure(
  caption: [Share Profile use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Share Profile use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to share their profile link with other users.],
    [Data], [Profile URL / shareable link],
    [Stimulus], [User selects Share Profile],
    [Response], [The system generates a shareable profile link and provides sharing options.],
  ),
)

#figure(
  caption: [Share Profile sequence diagram],
  image("../../../assets/Sequence diagrams/6-10/Share Profile sequence.svg"),
)
#figure(
  caption: [Profile navigation use case diagram],
  image("../../../assets/Use case diagrams/6-10/Profile Navigation use case.svg"),
)
#figure(
  caption: [Profile Navigation use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Profile Navigation use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to navigate between their Own Posts and Reposts tabs on the profile page.],
    [Data], [Own posts list, reposts list],
    [Stimulus], [User clicks on Own Posts or Reposts tab],
    [Response], [The system displays the selected tab content (own posts or reposts) on the profile page.],
    [Comment], [Tabs help organize profile content and improve the browsing experience.],
  ),
)

#figure(
  caption: [Profile Navigation sequence diagram],
  image("../../../assets/Sequence diagrams/6-10/Profile Navigation sequence.svg"),
)

#figure(
  caption: [View Own Posts use case diagram],
  image("../../../assets/Use case diagrams/6-10/View Own Posts use case.svg"),
)

#figure(
  caption: [View Own Posts use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[View Own Posts use case scenario],

    [Actors], [Active users],
    [Description], [The user shall be able to view all posts they have personally created on their profile.],
    [Data], [User’s created posts list],
    [Stimulus], [User opens their profile and selects the Own Posts section/tab],
    [Response], [The system retrieves and displays all posts created by the user.],
    [Comment], [This helps users review, manage, and showcase their content.],
  ),
)

#figure(
  caption: [View Own Posts sequence diagram],
  image("../../../assets/Sequence diagrams/6-10/View Own Posts sequence.svg"),
)
/******************/
#figure(
  caption: [View Reposts use case diagram],
  image("../../../assets/Use case diagrams/11-15/View Reposts use case diagram.svg"),
)
#figure(
  caption: [View Reposts use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[View Reposts use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to view all posts they have reposted on their profile.],
    [Data], [User’s reposted posts list],
    [Stimulus], [User opens their profile and selects the Reposts tab/section],
    [Response], [The system retrieves and displays all posts reposted by the user.],
    [Comment], [This helps users review and manage reposted content from their profile.],
  ),
)
#figure(
  caption: [View Reposts sequence diagram],
  image("../../../assets/Sequence diagrams/11-15/View Reposts sequence.svg"),
)

#figure(
  caption: [Access Settings Menu use case diagram],
  image("../../../assets/Use case diagrams/11-15/Access Settings Menu use case diagram.svg"),
)
#figure(
  caption: [Access Settings Menu use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Access Settings Menu use case scenario],

    [Actors], [Active users & passive users],
    [Description],
    [The user shall be able to access the settings page to manage account preferences and configurations.],
    [Data], [Account settings options and current user preferences],
    [Stimulus], [User clicks on Settings from the profile/menu],
    [Response], [The system opens the settings page and displays available settings options.],
    [Comment], [This provides a central place for users to control account and privacy preferences.],
  ),
)

#figure(
  caption: [Access Settings Menu sequence diagram],
  image("../../../assets/Sequence diagrams/11-15/Access Settings Menu sequence.svg"),
)

#figure(
  caption: [Account Privacy use case diagram],
  image("../../../assets/Use case diagrams/11-15/Account Privacy use case diagram.svg", height: 25%, fit: "contain"),
)
#figure(
  caption: [Account Privacy use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Account Privacy use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to switch their account privacy between public and private.],
    [Data], [Privacy setting (public/private)],
    [Stimulus], [User changes the privacy option in settings],
    [Response], [The system updates the privacy status and applies the new visibility rules to the account.],
    [Comment], [Privacy controls allow users to manage who can view and interact with their content.],
  ),
)

#figure(
  caption: [Account Privacy sequence diagram],
  image("../../../assets/Sequence diagrams/11-15/Account Privacy sequence.svg"),
)


#figure(
  caption: [Change Name use case diagram],
  image("../../../assets/Use case diagrams/11-15/Change Name use case diagram.svg", height: 22%, fit: "contain"),
)
#figure(
  caption: [Change Name use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Change Name use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to change their displayed first and last name.],
    [Data], [Updated first name and last name],
    [Stimulus], [User edits their name fields in settings and saves],
    [Response], [The system validates the input and updates the user’s displayed name across the platform.],
    [Comment], [This allows users to keep their identity information accurate and up to date.],
  ),
)

#figure(
  caption: [Change Name sequence diagram],
  image("../../../assets/Sequence diagrams/11-15/Change Name sequence.svg"),
)

#figure(
  caption: [Edit Bio use case diagram],
  image("../../../assets/Use case diagrams/11-15/Edit Bio use case diagram.svg", height: 20%, fit: "contain"),
)
#figure(
  caption: [Edit Bio use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Edit Bio use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to update their profile bio.],
    [Data], [Updated bio text],
    [Stimulus], [User edits the bio field in settings/edit profile and saves],
    [Response], [The system stores the updated bio and displays it on the user’s profile.],
    [Comment], [A bio helps users describe themselves and share brief information with others.],
  ),
)
#figure(
  caption: [Edit Bio sequence diagram],
  image("../../../assets/Sequence diagrams/11-15/Edit Bio sequence.svg"),
)
/**************************************************************/

#figure(
  caption: [Change Faculty/College use case diagram],
  image("../../../assets/Use case diagrams/16-25/Change Faculty use case.svg"),
)
#figure(
  caption: [Change Faculty/College use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Change Faculty/College use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to update their faculty or college information.],
    [Data], [Updated faculty/college value],
    [Stimulus], [User selects Change Faculty/College in settings and submits the new value],
    [Response], [The system validates the input and updates the user’s faculty/college information in the profile.],
    [Comment], [This keeps the user’s academic information accurate and supports faculty-based features.],
  ),
)

#figure(
  caption: [Change Faculty-College sequence diagram],
  image("../../../assets/Sequence diagrams/16-20/Change Faculty sequence.svg"),
)
#figure(
  caption: [Change Password use case diagram],
  image("../../../assets/Use case diagrams/16-25/Change Password use case.svg", height: 22%, fit: "contain"),
)
#figure(
  caption: [Change Password use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Change Password use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to securely change their account password.],
    [Data], [Current password, new password, confirmation password],
    [Stimulus], [User enters the current password and a new password then confirms the change],
    [Response], [The system verifies the current password, validates the new password, and updates it securely.],
    [Comment], [Changing the password improves account security and reduces risk of unauthorized access.],
  ),
)
#figure(
  caption: [Change Password sequence diagram],
  image("../../../assets/Sequence diagrams/16-20/Change Password sequence.svg"),
)

#figure(
  caption: [Manage Saved Posts use case diagram],
  image("../../../assets/Use case diagrams/16-25/Manage Saved Posts use case.svg", height: 22%, fit: "contain"),
)
#figure(
  caption: [Manage Saved Posts use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Manage Saved Posts use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to view and manage their saved posts.],
    [Data], [Saved posts list, saved status per post],
    [Stimulus], [User opens Saved Posts from settings/profile and selects a post to manage],
    [Response], [The system displays saved posts and allows the user to remove posts from saved items.],
    [Comment], [Saved posts help users keep important content for later access.],
  ),
)

#figure(
  caption: [Manage Saved Posts sequence diagram],
  image("../../../assets/Sequence diagrams/16-20/Manage Saved Posts sequence.svg"),
)

#figure(
  caption: [Manage Blocked Users use case diagram],
  image("../../../assets/Use case diagrams/16-25/Manage Blocked Users use case.svg", height: 22%, fit: "contain"),
)
#figure(
  caption: [Manage Blocked Users use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Manage Blocked Users use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to view and unblock previously blocked accounts.],
    [Data], [Blocked users list],
    [Stimulus], [User opens Blocked Users list and selects Unblock on a user],
    [Response], [The system removes the user from the blocked list and restores normal visibility and interactions.],
    [Comment], [Managing blocked users gives users control over their social interactions and safety.],
  ),
)

#figure(
  caption: [Manage Blocked Users sequence diagram],
  image("../../../assets/Sequence diagrams/16-20/Manage Blocked Users sequence.svg"),
)

#figure(
  caption: [View User Comments use case diagram],
  image("../../../assets/Use case diagrams/16-25/View User Comments use case.svg"),
)
#figure(
  caption: [View User Comments use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[View User Comments use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to view all comments they have previously written across the platform.],
    [Data], [List of user’s comments, associated posts],
    [Stimulus], [User opens Comments section from profile/settings],
    [Response], [The system retrieves and displays all comments made by the user with references to their posts.],
    [Comment], [This helps users review their activity and manage their interactions.],
  ),
)

#figure(
  caption: [View User Comments sequence diagram],
  image("../../../assets/Sequence diagrams/16-20/View User Comments sequence.svg"),
)

#figure(
  caption: [Logout use case diagram],
  image("../../../assets/Use case diagrams/16-25/Logout use case.svg"),
)
#figure(
  caption: [Logout use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Logout use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to log out from their account.],
    [Data], [Active session token],
    [Stimulus], [User selects Logout from settings/menu],
    [Response], [The system ends the session and redirects the user to the login/welcome page.],
    [Comment], [Logging out protects the account when using shared or public devices.],
  ),
)

#figure(
  caption: [Logout sequence diagram],
  image("../../../assets/Sequence diagrams/21-25/Log out sequence.svg"),
)
#figure(
  caption: [Delete Account use case diagram],
  image("../../../assets/Use case diagrams/16-25/Delete Account use case.svg", height: 22%, fit: "contain"),
)
#figure(
  caption: [Delete Account use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Delete Account use case scenario],

    [Actors], [Active users & passive users & Tech specialist],
    [Description], [The user shall be able to permanently delete their account and all associated data.],
    [Data], [User identity, deletion confirmation],
    [Stimulus], [User selects Delete Account and confirms the deletion request],
    [Response], [The system permanently removes the account according to policy and logs the user out.],
    [Comment], [Account deletion gives users control over their data and platform presence.],
  ),
)

#figure(
  caption: [Delete Account sequence diagram],
  image("../../../assets/Sequence diagrams/21-25/Delete Account sequence.svg"),
)

#figure(
  caption: [Deactivate Account use case diagram],
  image("../../../assets/Use case diagrams/16-25/Deactivate Account use case.svg", height: 30%, fit: "contain"),
)
#figure(
  caption: [Deactivate Account use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Deactivate Account use case scenario],

    [Actors], [Active users & passive users & Tech specialist],
    [Description], [The user shall be able to temporarily deactivate their account, allowing reactivation later.],
    [Data], [User identity, deactivation status],
    [Stimulus], [User selects Deactivate Account and confirms the request],
    [Response], [The system disables the account temporarily and hides the profile/content until reactivated.],
    [Comment], [Deactivation provides a reversible option for users who want a break from the platform.],
  ),
)

#figure(
  caption: [Deactivate Account sequence diagram],
  image("../../../assets/Sequence diagrams/21-25/Deactivate Account sequence.svg"),
)
#figure(
  caption: [Theme Selection use case diagram],
  image("../../../assets/Use case diagrams/16-25/Theme Selection use case.svg"),
)
#figure(
  caption: [Theme Selection use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Theme Selection use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to choose between light mode and dark mode for the application.],
    [Data], [Theme choice (light/dark)],
    [Stimulus], [User selects a theme option in settings],
    [Response], [The system applies the selected theme and saves the preference for future sessions.],
    [Comment], [Themes improve usability and accessibility based on user preference and lighting conditions.],
  ),
)
#figure(
  caption: [Theme Selection sequence diagram],
  image("../../../assets/Sequence diagrams/21-25/Theme Selection sequence.svg"),
)
#figure(
  caption: [Follow User use case diagram],
  image("../../../assets/Use case diagrams/16-25/Follow User use case.svg", height: 19%, fit: "contain"),
)
#figure(
  caption: [Follow User use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Follow User use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to follow other users.],
    [Data], [Follower relationship (follower_id, followed_id)],
    [Stimulus], [User clicks Follow on another user’s profile],
    [Response], [The system creates a follow relationship and updates the follower/following counts.],
    [Comment], [Following enables users to see content from accounts they are interested in.],
  ),
)
/********************************************************/
#figure(
  caption: [Follow User sequence diagram],
  image("../../../assets/Sequence diagrams/21-25/Follow User sequence.svg"),
)

#figure(
  caption: [Unfollow User use case diagram],
  image("../../../assets/Use case diagrams/26-35/Unfollow User use case.svg"),
)
#figure(
  caption: [Unfollow User use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Unfollow User use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to unfollow any user they currently follow.],
    [Data], [Follower relationship data],
    [Stimulus], [User clicks Unfollow on a followed user’s profile],
    [Response], [The system removes the follow relationship and updates follower counts.],
    [Comment], [Unfollowing allows users to control the content appearing in their feed.],
  ),
)
#figure(
  caption: [Unfollow User sequence diagram],
  image("../../../assets/Sequence diagrams/26-30/Unfollow User sequence.svg"),
)

#figure(
  caption: [View Followers use case diagram],
  image("../../../assets/Use case diagrams/26-35/View Followers use case.svg"),
)
#figure(
  caption: [View Followers use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[View Followers use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to view a list of all followers and search within that list.],
    [Data], [Followers list],
    [Stimulus], [User opens the Followers list],
    [Response], [The system displays all followers and allows searching within the list.],
    [Comment], [This helps users understand who is following their account.],
  ),
)
#figure(
  caption: [View Followers sequence diagram],
  image("../../../assets/Sequence diagrams/26-30/View Followers sequence.svg"),
)

#figure(
  caption: [View Following use case diagram],
  image("../../../assets/Use case diagrams/26-35/View Following use case.svg"),
)
#figure(
  caption: [View Following use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[View Following use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to view a list of all accounts they follow and search within that list.],
    [Data], [Following list],
    [Stimulus], [User opens the Following list],
    [Response], [The system displays all followed accounts and allows searching within the list.],
    [Comment], [This allows users to manage and review their followed accounts.],
  ),
)

#figure(
  caption: [View Following sequence diagram],
  image("../../../assets/Sequence diagrams/26-30/View Following sequence.svg"),
)

#figure(
  caption: [Block User use case diagram],
  image("../../../assets/Use case diagrams/26-35/Block User use case.svg"),
)
#figure(
  caption: [Block User use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Block User use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to block other users to stop interactions and visibility.],
    [Data], [Blocked user relationship],
    [Stimulus], [User selects Block on another user’s profile],
    [Response], [The system blocks the user and prevents further interactions between both users.],
    [Comment], [Blocking improves user safety and control over interactions.],
  ),
)

#figure(
  caption: [View Following sequence diagram],
  image("../../../assets/Sequence diagrams/26-30/View Following sequence.svg"),
)

#figure(
  caption: [Report User use case diagram],
  image("../../../assets/Use case diagrams/26-35/Report User use case.svg"),
)
#figure(
  caption: [Report User use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Report User use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to report another user for inappropriate or abusive behavior.],
    [Data], [Reported user, report reason],
    [Stimulus], [User submits a report against another user],
    [Response], [The system records the report and forwards it for moderation review.],
    [Comment], [Reporting helps maintain a safe and respectful platform environment.],
  ),
)

#figure(
  caption: [Report User sequence diagram],
  image("../../../assets/Sequence diagrams/26-30/Report User sequence.svg"),
)

#figure(
  caption: [Group Chats use case diagram],
  image("../../../assets/Use case diagrams/26-35/Group Chats use case.svg"),
)
#figure(
  caption: [Group Chats use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Group Chats use case scenario],

    [Actors], [Active users & passive users],
    [Description], [Users should be able to create or join group chats.],
    [Data], [Group chat details, participants list],
    [Stimulus], [User creates or joins a group chat],
    [Response], [The system creates the group chat and allows users to exchange messages.],
    [Comment], [Group chats enable collaborative and social communication.],
  ),
)

#figure(
  caption: [Group Chats sequence diagram],
  image("../../../assets/Sequence diagrams/31-35/Group Chats sequence.svg"),
)

#figure(
  caption: [Direct Messages use case diagram],
  image("../../../assets/Use case diagrams/26-35/Direct Messages use case.svg"),
)
#figure(
  caption: [Direct Messages use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Direct Messages use case scenario],

    [Actors], [Active users & passive users],
    [Description], [Users shall be able to send and receive direct messages with other users.],
    [Data], [Message content, sender, receiver],
    [Stimulus], [User sends a direct message],
    [Response], [The system delivers the message to the recipient in real time or stores it until received.],
    [Comment], [Direct messaging enables private communication between users.],
  ),
)

#figure(
  caption: [Direct Messages sequence diagram],
  image("../../../assets/Sequence diagrams/31-35/Direct Messages sequence.svg"),
)


#figure(
  caption: [Video Calling use case diagram],
  image("../../../assets/Use case diagrams/26-35/Video Calling use case.svg"),
)
#figure(
  caption: [Video Calling use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Video Calling use case scenario],

    [Actors], [Active users & passive users],
    [Description], [Users shall be able to initiate and receive video calls with other users.],
    [Data], [Call session data],
    [Stimulus], [User initiates a video call],
    [Response], [The system establishes a video call connection between users.],
    [Comment], [Video calls enhance real-time interaction and communication.],
  ),
)

#figure(
  caption: [Video Calling sequence diagram],
  image("../../../assets/Sequence diagrams/31-35/Video Calling sequence.svg"),
)

#figure(
  caption: [Lost and Found Posts use case diagram],
  image("../../../assets/Use case diagrams/26-35/Lost and Found Posts use case.svg"),
)
#figure(
  caption: [Lost and Found Posts use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Lost and Found Posts use case scenario],

    [Actors], [Active users & passive users],
    [Description], [Users shall be able to create and view lost-and-found posts for items or announcements.],
    [Data], [Lost-and-found post details],
    [Stimulus], [User creates or views a lost-and-found post],
    [Response], [The system publishes and displays lost-and-found posts to other users.],
    [Comment], [This feature helps users recover lost items within the community.],
  ),
)

#figure(
  caption: [Lost and Found Posts sequence diagram],
  image("../../../assets/Sequence diagrams/31-35/Lost and Found Posts sequence.svg"),
)

#figure(
  caption: [Create Post use case diagram],
  image("../../../assets/Use case diagrams/26-35/Create Post use case.svg"),
)
#figure(
  caption: [Create Post use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Create Post use case scenario],

    [Actors], [Active users],
    [Description], [Users shall be able to create and publish posts containing text and/or media.],
    [Data], [Post content (text, images, media)],
    [Stimulus], [User submits a new post],
    [Response], [The system validates and publishes the post to the feed.],
    [Comment], [Creating posts allows users to share content and interact with others.],
  ),
)
#figure(
  caption: [Create Post sequence diagram],
  image("../../../assets/Sequence diagrams/31-35/Create Post sequence.svg"),
)


#figure(
  caption: [View Feed Posts use case diagram],
  image("../../../assets/Use case diagrams/36-49/View Feed Posts use case.svg"),
)
#figure(
  caption: [View Feed Posts use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[View Feed Posts use case scenario],

    [Actors], [Active users & passive users],
    [Description],
    [The user shall be able to view the post feed containing posts from followed users and recommended posts.],
    [Data], [Feed posts list, recommendation results],
    [Stimulus], [User opens the feed page],
    [Response], [The system retrieves and displays posts from followed users and recommended content.],
    [Comment], [The feed is the main place where users discover content and updates.],
  ),
)

#figure(
  caption: [View Feed Posts sequence diagram],
  image("../../../assets/Sequence diagrams/36-40/View Feed Posts sequence.svg"),
)



#figure(
  caption: [Like Post use case diagram],
  image("../../../assets/Use case diagrams/36-49/Like Post use case.svg"),
)
#figure(
  caption: [Like Post use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Like Post use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to like any post visible to them.],
    [Data], [Like record (user, post), like count],
    [Stimulus], [User clicks Like on a post],
    [Response], [The system records the like and updates the like count for the post.],
    [Comment], [Likes help measure engagement and influence recommendations.],
  ),
)

#figure(
  caption: [Like Post sequence diagram],
  image("../../../assets/Sequence diagrams/36-40/Like Post sequence.svg"),
)

#figure(
  caption: [Unlike Post use case diagram],
  image("../../../assets/Use case diagrams/36-49/Unlike Post use case.svg"),
)
#figure(
  caption: [Unlike Post use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Unlike Post use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to remove their like from any post they previously liked.],
    [Data], [Like record (user, post), updated like count],
    [Stimulus], [User clicks Unlike (remove like) on a post they liked],
    [Response], [The system removes the like record and updates the like count.],
    [Comment], [Users can change their reactions and keep engagement accurate.],
  ),
)

#figure(
  caption: [Unlike Post sequence diagram],
  image("../../../assets/Sequence diagrams/36-40/Unlike Post sequence.svg"),
)

#figure(
  caption: [Comment on Post use case diagram],
  image("../../../assets/Use case diagrams/36-49/Comment on Post use case.svg"),
)
#figure(
  caption: [Comment on Post use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Comment on Post use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to add comments to posts.],
    [Data], [Comment text, post ID, user ID, timestamp],
    [Stimulus], [User writes a comment and submits it],
    [Response], [The system stores the comment and displays it under the post.],
    [Comment], [Comments enable discussion and richer engagement.],
  ),
)

#figure(
  caption: [Comment on Post sequence diagram],
  image("../../../assets/Sequence diagrams/36-40/Comment on Post sequence.svg"),
)

#figure(
  caption: [Delete Post use case diagram],
  image("../../../assets/Use case diagrams/36-49/Delete Post use case.svg"),
)
#figure(
  caption: [Delete Post use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Delete Post use case scenario],

    [Actors], [Active users],
    [Description], [The user shall be able to delete any of their own posts.],
    [Data], [Post ID, ownership information],
    [Stimulus], [User selects Delete on one of their posts and confirms],
    [Response], [The system verifies ownership and removes the post from the platform feed and profile.],
    [Comment], [Deleting posts allows users to control their published content.],
  ),
)

#figure(
  caption: [Delete Post sequence diagram],
  image("../../../assets/Sequence diagrams/36-40/Delete Post sequence.svg"),
)

#figure(
  caption: [Share Post use case diagram],
  image("../../../assets/Use case diagrams/36-49/Share Post use case.svg"),
)
#figure(
  caption: [Share Post use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Share Post use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to share existing posts with other users inside the platform.],
    [Data], [Post link/ID, sharing target (user/chat/group)],
    [Stimulus], [User selects Share on a post and chooses a recipient or destination],
    [Response], [The system sends the post reference to the selected destination within the platform.],
    [Comment], [Sharing helps spread useful or interesting content among users.],
  ),
)

#figure(
  caption: [Share Post sequence diagram],
  image("../../../assets/Sequence diagrams/41-45/Share Post sequence.svg"),
)

#figure(
  caption: [Report Post use case diagram],
  image("../../../assets/Use case diagrams/36-49/Report Post use case.svg"),
)
#figure(
  caption: [Report Post use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Report Post use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to report posts for inappropriate or harmful content.],
    [Data], [Post ID, report reason, reporter ID, timestamp],
    [Stimulus], [User selects Report on a post and submits a reason],
    [Response], [The system records the report and forwards it to moderation for review.],
    [Comment], [Reporting supports content moderation and platform safety.],
  ),
)

#figure(
  caption: [Report Post sequence diagram],
  image("../../../assets/Sequence diagrams/41-45/Report Post sequence.svg"),
)
#figure(
  caption: [Save Post use case diagram],
  image("../../../assets/Use case diagrams/36-49/Save Post use case.svg"),
)
#figure(
  caption: [Save Post use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Save Post use case scenario],

    [Actors], [Active users & passive users],
    [Description], [The user shall be able to save any post for later viewing.],
    [Data], [Saved post record (user, post)],
    [Stimulus], [User selects Save on a post],
    [Response], [The system adds the post to the user’s saved list and marks it as saved.],
    [Comment], [Saving posts helps users revisit important content later.],
  ),
)

#figure(
  caption: [Save Post sequence diagram],
  image("../../../assets/Sequence diagrams/41-45/Save Post sequence.svg"),
)

#figure(
  caption: [Repost use case diagram],
  image("../../../assets/Use case diagrams/36-49/Repost use case.svg"),
)
#figure(
  caption: [Repost use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Repost use case scenario],

    [Actors], [Active users],
    [Description], [The user shall be able to repost content so that it appears on their profile or feed.],
    [Data], [Original post ID, repost record (user, post)],
    [Stimulus], [User selects Repost on a post],
    [Response], [The system creates a repost entry and displays it on the user’s profile and/or feed.],
    [Comment], [Reposting helps users share content with their followers.],
  ),
)
#figure(
  caption: [Repost sequence diagram],
  image("../../../assets/Sequence diagrams/41-45/Repost sequence.svg"),
)

#figure(
  caption: [Manage Comments use case diagram],
  image("../../../assets/Use case diagrams/36-49/Manage Comments use case.svg"),
)
#figure(
  caption: [Manage Comments use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Manage Comments use case scenario],

    [Actors], [Active users & passive users],
    [Description],
    [The user shall be able to view and delete comments on their posts and optionally limit who can comment.],
    [Data], [Post comments list, comment permissions settings],
    [Stimulus], [User opens comment management options for their post],
    [Response], [The system displays comments, allows deletion, and applies comment limitation settings if selected.],
    [Comment], [Managing comments helps reduce spam and maintain respectful discussions.],
  ),
)

#figure(
  caption: [Manage Comments sequence diagram],
  image("../../../assets/Sequence diagrams/41-45/Manage Comments sequence.svg"),
)

#figure(
  caption: [Post Recommendations use case diagram],
  image("../../../assets/Use case diagrams/36-49/Post Recommendations use case.svg"),
)
#figure(
  caption: [Post Recommendations use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Post Recommendations use case scenario],

    [Actors], [Active users & passive users],
    [Description],
    [The system shall recommend posts to users based on their interests, interactions, and following behavior.],
    [Data], [User interactions, interests, following list, recommendation scores],
    [Stimulus], [User opens the feed or discovery section],
    [Response], [The system ranks and displays recommended posts tailored to the user.],
    [Comment], [Recommendations help users discover relevant content and increase engagement.],
  ),
)

#figure(
  caption: [Post Recommendations sequence diagram],
  image("../../../assets/Sequence diagrams/46-49/Post Recommendations sequence.svg"),
)

#figure(
  caption: [Display Ads on Feed use case diagram],
  image(
    "../../../assets/Use case diagrams/36-49/Clickable ads and Diaplay ads on feed use case.svg",
    height: 40%,
    fit: "contain",
  ),
)
#figure(
  caption: [Display Ads on Feed use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Display Ads on Feed use case scenario],

    [Actors], [Active users & passive users & Ad provider],
    [Description], [The user shall be able to view ads on their feed page.],
    [Data], [Ad content, targeting metadata, impression tracking],
    [Stimulus], [User scrolls the feed page],
    [Response], [The system displays ads at defined positions within the feed and records impressions.],
    [Comment], [Ads support platform monetization and can be targeted to user interests.],
  ),
)


#figure(
  caption: [Clickable Ads use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Clickable Ads use case scenario],

    [Actors], [Active users & passive users & Ad provider],
    [Description], [The user shall be able to click on an ad that will take them to the ad provider website.],
    [Data], [Ad link/URL, click tracking data],
    [Stimulus], [User clicks an ad displayed in the feed],
    [Response], [The system records the click event and redirects the user to the ad provider website.],
    [Comment], [Clickable ads increase engagement and enable click-based monetization.],
  ),
)

#figure(
  caption: [Display Ads on Feed sequence diagram],
  image("../../../assets/Sequence diagrams/46-49/Display Ads on Feed sequence.svg"),
)

#figure(
  caption: [Clickable Ads sequence diagram],
  image("../../../assets/Sequence diagrams/46-49/Clickable Ads sequence.svg"),
)

#figure(
  caption: [Report Ad use case diagram],
  image("../../../assets/Use case diagrams/36-49/Report ad use case.svg", height: 35%, fit: "contain"),
)
#figure(
  caption: [Report Ad use case scenario],
  table(
    columns: 2,

    table.cell(colspan: 2)[Report Ad use case scenario],

    [Actors], [Active users & passive users & Ad provider],
    [Description], [The user shall be able to report an advertisement that is NSFW or inappropriate.],
    [Data], [Ad ID, report reason, reporter ID, timestamp],
    [Stimulus], [User selects Report on an ad and submits a reason],
    [Response], [The system records the report and forwards it to moderation for review and possible removal.],
    [Comment], [Reporting ads helps maintain appropriate content and protect users from harmful material.],
  ),
)
#figure(
  caption: [Report Ad sequence diagram],
  image("../../../assets/Sequence diagrams/46-49/Report Ad sequence.svg"),
)
