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
  caption: [Create Account, Request Verification Code and Submit Verification Code use case diagram],
  image(
    "../../../assets/Use case diagrams/1-10/Create Account, Request Verification Code and Submit Verification Code use case diagram.svg",
  ),
)
#figure(
  caption: [Create Account use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Create Account use case scenario],
    [Actors], [User (unregistered visitor)],
    [Description],
    [A visitor creates a new account by submitting a unique username, university email, first name, last name, college, and password. The system restricts registration to valid `@ju.edu.jo` emails, rejects duplicate usernames or emails, stores the user as unverified, creates the corresponding node in the social graph, and automatically dispatches a verification code.],
    [Data], [Registration details (username, `@ju.edu.jo` email, first name, last name, college, password)],
    [Stimulus], [The user fills the registration form and selects "Register".],
    [Response],
    [The system validates the inputs, hashes the password, persists an unverified user, creates the user node in the graph database, and emails a 6-digit OTP to the university address.],
    [Comment], [The account stays inactive until the email is verified (see FR3).],
  ),
)

#figure(
  caption: [Request Verification Code use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Request Verification Code use case scenario],
    [Actors], [User (during registration or recovery)],
    [Description],
    [The system sends a 6-digit verification code to the user's university email. The user may explicitly request a new code after a short cooldown; any previously issued code is invalidated first.],
    [Data], [University email address],
    [Stimulus], [Registration triggers it automatically, or the user taps "Resend code".],
    [Response],
    [The system generates a 6-digit code, deletes any existing code for that email, stores the new code with a 3-minute expiry, and sends it by email.],
    [Comment], [Codes expire after 3 minutes; only the most recent code per email is valid.],
  ),
)

#figure(
  caption: [Submit Verification Code use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Submit Verification Code use case scenario],
    [Actors], [User],
    [Description],
    [The user submits the received 6-digit code to verify their identity. The system enforces a 3-minute validity window and, on success, activates the account by marking the email as verified.],
    [Data], [University email address and 6-digit code],
    [Stimulus], [The user enters the code and selects "Verify".],
    [Response],
    [The system validates the code against the stored value and expiry; on success it deletes the code and flags the user's email as verified, otherwise it returns an invalid/expired error.],
    [Comment], [A correct, unexpired code activates the account; expired codes are removed automatically.],
  ),
)




#figure(
  caption: [Create Account sequence diagram],
  image("../../../assets/Sequence diagrams/1-10/Create Account sequence diagram.svg"),
)
#figure(
  caption: [Request Verification Code sequence diagram],
  image("../../../assets/Sequence diagrams/1-10/Request Verification Code sequence diagram.svg"),
)
#figure(
  caption: [Submit Verification Code sequence diagram],
  image("../../../assets/Sequence diagrams/1-10/Submit Verification Code sequence diagram.svg"),
)
#pagebreak()
// -------------------------------------------------------------------------------

#figure(
  caption: [Log In to Account use case diagram],
  image("../../../assets/Use case diagrams/1-10/Log In to Account use case diagram.svg"),
)
#figure(
  caption: [Log In to Account use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Log In to Account use case scenario],
    [Actors], [User],
    [Description],
    [The user logs in securely using either their username or university email together with their password. On success the system issues a stateless JWT and returns first-login and theme flags.],
    [Data], [Identifier (username or email) and password],
    [Stimulus], [The user submits the login form.],
    [Response],
    [The system locates the user, validates the password (BCrypt) and email-verified status, generates a JWT, and returns the token together with `isFirstLogin` and `themePreference`.],
    [Comment], [Unverified accounts are blocked from logging in.],
  ),
)


#figure(
  caption: [Log In to Account sequence diagram],
  image("../../../assets/Sequence diagrams/1-10/Log In to Account sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------

#figure(
  caption: [Reset Password use case diagram],
  image("../../../assets/Use case diagrams/1-10/Reset Password use case diagram.svg"),
)

#figure(
  caption: [Reset Password use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Reset Password use case scenario],
    [Actors], [User],
    [Description],
    [The user resets a forgotten password after proving identity via an email OTP. The system emails a code, then accepts a new password only when a valid code is supplied.],
    [Data], [University email, 6-digit code, new password],
    [Stimulus], [The user selects "Forgot password", requests a code, then submits the code with a new password.],
    [Response],
    [The system emails a 3-minute OTP; on a valid code and acceptable new password, it stores the new hashed password.],
    [Comment], [Identity is verified by OTP before any password change is permitted.],
  ),
)

#figure(
  caption: [Reset Password sequence diagram],
  image("../../../assets/Sequence diagrams/1-10/Reset Password sequence diagram.svg"),
)

// --------------------------------------------------------------------------------

#figure(
  caption: [Initialize Profile use case diagram],
  image("../../../assets/Use case diagrams/1-10/Initialize Profile use case diagram.svg"),
)

#figure(
  caption: [Initialize Profile use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Initialize Profile use case scenario],
    [Actors], [User (First-time login)],
    [Description],
    [Upon the first successful login, the user is directed to a mandatory onboarding screen to initialize the profile: profile picture, banner photo, short biography, and theme preference (Light, Dark, or System).],
    [Data], [Bio, profile picture, banner photo, theme preference],
    [Stimulus], [The user completes the onboarding form and selects "Finish".],
    [Response],
    [The system uploads the supplied images through the media pipeline, stores the bio, images, and theme, and flips the `isFirstLogin` flag to false.],
    [Comment], [Onboarding is mandatory before reaching the main platform; the first-login flag is cleared here.],
  ),
)

#figure(
  caption: [Initialize Profile sequence diagram],
  image("../../../assets/Sequence diagrams/1-10/Initialize Profile sequence diagram.svg"),
)

// --------------------------------------------------------------------------------


#figure(
  caption: [Upload Media use case diagram],
  image("../../../assets/Use case diagrams/1-10/Upload Media use case diagram.svg"),
)


#figure(
  caption: [Upload Media use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Upload Media use case scenario],
    [Actors], [User],
    [Description],
    [The user selects and uploads image files for the profile and banner photos during onboarding and later profile edits. Image bytes are sent to the shared media pipeline, which returns a hosted URL.],
    [Data], [Image file bytes, filename, content type, image variant],
    [Stimulus], [The user picks an image in the onboarding or profile-edit screen.],
    [Response],
    [The system uploads the image to the media store and returns a hosted URL, which is persisted on the user record.],
    [Comment], [Shared pipeline reused by onboarding (FR6) and profile editing (FR13).],
  ),
)

#figure(
  caption: [Upload Media sequence diagram],
  image("../../../assets/Sequence diagrams/1-10/Upload Media sequence diagram.svg"),
)

// ---------------------------------------------------------------------------------
#figure(
  caption: [Log Out of Session use case diagram],
  image("../../../assets/Use case diagrams/1-10/Log Out of Session use case diagram.svg"),
)
#figure(
  caption: [Log Out of Session use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Log Out of Session use case scenario],
    [Actors], [User],
    [Description],
    [The user terminates the active session from the navigation menu. Because the platform uses stateless JWT authentication, the client discards the stored token and redirects to the public login screen.],
    [Data], [Stored authentication token (client side)],
    [Stimulus], [The user selects "Log out".],
    [Response],
    [The client removes the JWT from storage, resets the authentication state, and redirects to the login screen; subsequent requests are unauthenticated.],
    [Comment],
    [Stateless JWT design — there is no server-side session to invalidate; the token is discarded on the client.],
  ),
)
#figure(
  caption: [Log Out of Session sequence diagram],
  image("../../../assets/Sequence diagrams/1-10/Log Out of Session sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Delete Account use case diagram],
  image("../../../assets/Use case diagrams/1-10/Delete account use case diagram.svg"),
)
#figure(
  caption: [Delete Account use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Delete Account use case scenario],
    [Actors], [User],
    [Description],
    [The user permanently deletes the account after confirming with an email OTP. The system removes the user's presence across all contexts: profile, posts, comments, media, private messages, blocks, and the social-graph node.],
    [Data], [Confirmation OTP],
    [Stimulus], [The user selects "Delete account", requests an OTP, then confirms with the code.],
    [Response],
    [The system verifies the OTP and cascades deletion of chat data, post data, lost & found listings, blocks, the OTP record, the graph node, and finally the user record.],
    [Comment],
    [Irreversible action that cascades across the chat, posts, lost & found, blocking, and following contexts.],
  ),
)
#figure(
  caption: [Delete Account sequence diagram],
  image("../../../assets/Sequence diagrams/1-10/Delete Account sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [View Own Profile use case diagram],
  image("../../../assets/Use case diagrams/1-10/View Own Profile use case diagram.svg"),
)
#figure(
  caption: [View Own Profile use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[View Own Profile use case scenario],
    [Actors], [User],
    [Description],
    [The user views their personal profile page, which displays the profile picture, banner photo, full name, college, biography, total post count, and follower/following statistics.],
    [Data], [Authenticated user's email (from the JWT principal)],
    [Stimulus], [The user opens their profile page.],
    [Response],
    [The system returns the profile DTO including the total post count; follower and following counts are loaded separately through the Following context endpoints.],
    [Comment], [Post count comes from the Posts context; connection counts are fetched from the Following context.],
  ),
)
#figure(
  caption: [View Own Profile sequence diagram],
  image("../../../assets/Sequence diagrams/1-10/View Own Profile sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Navigate Profile Tabs use case diagram],
  image("../../../assets/Use case diagrams/11-20/Navigate Profile Tabs use case diagram.svg"),
)
#figure(
  caption: [Navigate Profile Tabs use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Navigate Profile Tabs use case scenario],
    [Actors], [User],
    [Description],
    [The user navigates between a tab showing their own published posts and a private tab showing their saved (favorited) posts directly from the profile page.],
    [Data], [Username (for published posts), authenticated user id (for favorites), pagination],
    [Stimulus], [The user taps the "Posts" tab or the "Saved" tab.],
    [Response],
    [The system returns the paginated published posts for that user, or the user's private favorited posts, depending on the selected tab.],
    [Comment], [The saved (favorites) tab is private to the profile owner.],
  ),
)
#figure(
  caption: [Navigate Profile Tabs sequence diagram],
  image("../../../assets/Sequence diagrams/11-20/Navigate Profile Tabs sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [View Other Profiles use case diagram],
  image("../../../assets/Use case diagrams/11-20/View Other Profiles use case diagram.svg"),
)
#figure(
  caption: [View Other Profiles use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[View Other Profiles use case scenario],
    [Actors], [User],
    [Description],
    [The user looks up and views the public profile of another user. The system hides the profile and restricts access if either user has blocked the other.],
    [Data], [Current user's email (JWT principal), target username],
    [Stimulus], [The user opens another user's profile.],
    [Response],
    [The system loads both users, asserts that neither has blocked the other, then returns the target's profile DTO with post count; otherwise it returns an access error.],
    [Comment], [A block in either direction makes the profile inaccessible.],
  ),
)
#figure(
  caption: [View Other Profiles sequence diagram],
  image("../../../assets/Sequence diagrams/11-20/View Other Profiles sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Edit Profile Details use case diagram],
  image("../../../assets/Use case diagrams/11-20/Edit Profile Details use case diagram.svg"),
)
#figure(
  caption: [Edit Profile Details use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Edit Profile Details use case scenario],
    [Actors], [User],
    [Description],
    [The user modifies profile details via an edit interface: biography, academic college, theme, and new profile or banner images.],
    [Data], [Bio, theme preference, profile/banner image bytes or URLs],
    [Stimulus], [The user changes fields in the edit screen and selects "Save".],
    [Response],
    [The system updates supplied fields, uploads any new images through the media pipeline, persists the user, and returns the refreshed profile.],
    [Comment], [Only the fields that changed are updated; images are optional.],
  ),
)
#figure(
  caption: [Edit Profile Details sequence diagram],
  image("../../../assets/Sequence diagrams/11-20/Edit Profile Details sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [View Connection Lists use case diagram],
  image("../../../assets/Use case diagrams/11-20/View Connection Lists use case diagram.svg"),
)
#figure(
  caption: [View Connection Lists use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[View Connection Lists use case scenario],
    [Actors], [User],
    [Description],
    [The user clicks the follower or following count on any profile to view a detailed, interactive, paginated list of those users.],
    [Data], [Target username, list type (followers/following), pagination],
    [Stimulus], [The user taps a follower or following count.],
    [Response],
    [The system retrieves the block-aware list of usernames from the graph, enriches each with full name and picture, and returns a paginated interactive list.],
    [Comment], [Lists exclude any account blocked in either direction.],
  ),
)
#figure(
  caption: [View Connection Lists sequence diagram],
  image("../../../assets/Sequence diagrams/11-20/View Connection Lists sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [View Mutual Followers use case diagram],
  image("../../../assets/Use case diagrams/11-20/View Mutual Followers use case diagram.svg"),
)
#figure(
  caption: [View Mutual Followers use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[View Mutual Followers use case scenario],
    [Actors], [User],
    [Description],
    [When viewing another user's profile, the user sees a summary of shared connections, showing the exact count and names of mutual followers.],
    [Data], [Current username, other username, pagination],
    [Stimulus], [The user opens another user's profile.],
    [Response],
    [The system computes the intersection of both users' followers in the graph (block-aware) and returns the mutual followers with the total count.],
    [Comment], [Used to render the "followed by X, Y and N others" summary.],
  ),
)
#figure(
  caption: [View Mutual Followers sequence diagram],
  image("../../../assets/Sequence diagrams/11-20/View Mutual Followers sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Message Friend use case diagram],
  image("../../../assets/Use case diagrams/11-20/Message Friend use case diagram.svg"),
)
#figure(
  caption: [Message Friend use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Message Friend use case scenario],
    [Actors], [User (mutual follower)],
    [Description],
    [When viewing the profile of a mutually followed user, the user opens a private message chat via a direct shortcut in the profile header.],
    [Data], [Requester username, target username],
    [Stimulus], [The user taps the "Message" shortcut, shown only for mutual follows.],
    [Response],
    [The system asserts the two users are mutual friends, then returns an existing DM conversation or creates a new one and returns it.],
    [Comment], [Conversation creation is restricted to mutual friends to prevent spam.],
  ),
)
#figure(
  caption: [Message Friend sequence diagram],
  image("../../../assets/Sequence diagrams/11-20/Message Friend sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Toggle Follow Status use case diagram],
  image("../../../assets/Use case diagrams/11-20/Toggle Follow use case diagram.svg"),
)
#figure(
  caption: [Toggle Follow Status use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Toggle Follow Status use case scenario],
    [Actors], [User],
    [Description],
    [The user follows or unfollows another user to curate their social feed and manage connections.],
    [Data], [Follower username, followee username],
    [Stimulus], [The user taps "Follow" or "Unfollow".],
    [Response],
    [On follow, the system verifies no block exists and creates a FOLLOWS relationship in the graph (if not already present); on unfollow it removes the relationship.],
    [Comment], [Following is blocked when either party has blocked the other.],
  ),
)
#figure(
  caption: [Toggle Follow Status sequence diagram],
  image("../../../assets/Sequence diagrams/11-20/Toggle Follow Status sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Search Connection Lists use case diagram],
  image("../../../assets/Use case diagrams/11-20/Search Connection Lists use case diagram.svg"),
)
#figure(
  caption: [Search Connection Lists use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Search Connection Lists use case scenario],
    [Actors], [User],
    [Description],
    [The user views detailed lists of followers, following, and mutual friends, and searches within these lists to quickly filter and locate specific accounts.],
    [Data], [List type, pagination, search text],
    [Stimulus], [The user opens a connection list and types in the search box.],
    [Response],
    [The system returns the paginated list; the client filters the loaded entries by username and full name in real time as the user types.],
    [Comment], [Filtering is performed client-side over the fetched connection pages.],
  ),
)
#figure(
  caption: [Search Connection Lists sequence diagram],
  image("../../../assets/Sequence diagrams/11-20/Search Connection Lists sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [View Mutual Connections use case diagram],
  image("../../../assets/Use case diagrams/11-20/View Mutual connections use case diagram.svg"),
)
#figure(
  caption: [View Mutual Connections use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[View Mutual Connections use case scenario],
    [Actors], [User],
    [Description],
    [When visiting another user's profile, the user views shared connections — the names and count of mutual followers — to encourage networking.],
    [Data], [Current username, other username, pagination],
    [Stimulus], [The user expands the mutual-followers summary.],
    [Response], [The system returns the paginated, block-aware list of mutual followers with the total count.],
    [Comment], [Mutual lists exclude any account blocked in either direction.],
  ),
)
#figure(
  caption: [View Mutual Connections sequence diagram],
  image("../../../assets/Sequence diagrams/11-20/View Mutual Connections sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Discover Friend Suggestions use case diagram],
  image("../../../assets/Use case diagrams/11-20/Discover Friend Suggestions use case diagram.svg"),
)
#figure(
  caption: [Discover Friend Suggestions use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Discover Friend Suggestions use case scenario],
    [Actors], [User],
    [Description],
    [The user is presented with a curated list of personalized friend recommendations, calculated from their current network and the number of mutual connections shared with other students.],
    [Data], [Authenticated username],
    [Stimulus], [The user opens the friend-suggestions panel.],
    [Response],
    [The system excludes already-followed and blocked users, scores candidate students by mutual connections and recent activity, enriches them with profile details, and returns ranked suggestions.],
    [Comment], [Block-aware; users the requester already follows are excluded.],
  ),
)
#figure(
  caption: [Discover Friend Suggestions sequence diagram],
  image("../../../assets/Sequence diagrams/11-20/Discover Friend Suggestions sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Display Live Relationship Status use case diagram],
  image("../../../assets/Use case diagrams/21-30/Display Live Relationship Status use case diagram.svg"),
)
#figure(
  caption: [Display Live Relationship Status use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Display Live Relationship Status use case scenario],
    [Actors], [User],
    [Description],
    [The system dynamically reflects the user's relationship with another account, showing "Follow", "Unfollow", or unlocking direct messaging for mutual follows.],
    [Data], [Current username, target username],
    [Stimulus], [The user opens another user's profile (the status component mounts).],
    [Response],
    [The system queries the follow and mutual status from the graph and the client renders the appropriate action (Follow / Unfollow) and enables the Message shortcut only when the relationship is mutual.],
    [Comment], [Both status checks are block-aware; a blocked relationship reports neither following nor mutual.],
  ),
)
#figure(
  caption: [Display Live Relationship Status sequence diagram],
  image("../../../assets/Sequence diagrams/21-30/Display Live Relationship Status sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Enforce Graph Privacy use case diagram],
  image("../../../assets/Use case diagrams/21-30/Enforce Graph Privacy use case diagram.svg"),
)
#figure(
  caption: [Enforce Graph Privacy use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Enforce Graph Privacy use case scenario],
    [Actors], [System (privacy enforcement)],
    [Description],
    [The system automatically respects privacy settings by preventing users from following, being followed by, or appearing in the mutual lists and friend suggestions of any account blocked in either direction.],
    [Data], [Acting username, counterpart username/ids],
    [Stimulus], [Any follow, list, mutual, or suggestion operation that touches the social graph.],
    [Response],
    [Write operations call `assertNotBlocked` and are rejected when a block exists; read operations use block-aware Cypher (`WHERE NOT (a)-[:BLOCKED]->(b)`) so blocked accounts never appear in results.],
    [Comment], [Enforcement is centralized in the graph queries and the Block service, not in the UI.],
  ),
)
#figure(
  caption: [Enforce Graph Privacy sequence diagram],
  image("../../../assets/Sequence diagrams/21-30/Enforce Graph Privacy sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Report Lost or Found Items use case diagram],
  image("../../../assets/Use case diagrams/21-30/Report Lost or Found Items use case diagram.svg"),
)
#figure(
  caption: [Report Lost or Found Items use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Report Lost or Found Items use case scenario],
    [Actors], [User],
    [Description],
    [The user publishes a listing for a lost or found item, including the type (Lost/Found), a description, photos, the associated college, and an optional contact phone number.],
    [Data], [Type, description, image URL(s), college, optional phone number],
    [Stimulus], [The user fills the listing form and selects "Post".],
    [Response],
    [The system stores the listing as unresolved, resolves the owner's details, dispatches localized alerts to same-college students (FR28), and returns the created listing.],
    [Comment], [Listings start in the "Pending" (unresolved) state.],
  ),
)
#figure(
  caption: [Report Lost or Found Items sequence diagram],
  image("../../../assets/Sequence diagrams/21-30/Report Lost or Found Items sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Browse and Filter Listings use case diagram],
  image("../../../assets/Use case diagrams/21-30/Browse and Filter Listings use case diagram.svg"),
)
#figure(
  caption: [Browse and Filter Listings use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Browse and Filter Listings use case scenario],
    [Actors], [User],
    [Description],
    [The user browses a continuous feed of reported items and applies interactive filters by item type (Lost vs. Found), resolution status (Pending vs. Resolved), and college.],
    [Data], [Optional filters: college, type, isResolved; pagination],
    [Stimulus], [The user opens the Lost & Found feed and toggles filters.],
    [Response],
    [The system selects the matching repository query based on which filters are present, returns the paginated listings, and enriches each with owner details.],
    [Comment], [Any combination of the three filters is supported, including none (full feed).],
  ),
)
#figure(
  caption: [Browse and Filter Listings sequence diagram],
  image("../../../assets/Sequence diagrams/21-30/Browse and Filter Listings sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Submit Claim Request use case diagram],
  image("../../../assets/Use case diagrams/21-30/Submit Claim Request use case diagram.svg"),
)
#figure(
  caption: [Submit Claim Request use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Submit Claim Request use case scenario],
    [Actors], [User (claimant)],
    [Description],
    [The user submits a formal "Claim" on an active listing with a custom message (e.g. proof of ownership), which is delivered to the listing's owner.],
    [Data], [Listing id, claimant id, claim message],
    [Stimulus], [The user taps "Claim" and writes a message.],
    [Response],
    [The system rejects claims on resolved listings or on the claimant's own listing; otherwise it sends a claim notification to the owner and returns a claim response.],
    [Comment],
    [The claim notification is the primary contact channel between a claimant and a listing owner who are not mutual friends.],
  ),
)
#figure(
  caption: [Submit Claim Request sequence diagram],
  image("../../../assets/Sequence diagrams/21-30/Submit Claim Request sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Message Listing Owner use case diagram],
  image("../../../assets/Use case diagrams/21-30/Message Listing Owner use case diagram.svg"),
)
#figure(
  caption: [Message Listing Owner use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Message Listing Owner use case scenario],
    [Actors], [User],
    [Description],
    [The user opens a private chat with an item's owner via a quick-access button on the listing to coordinate the item's return.],
    [Data], [Requester username, owner username],
    [Stimulus], [The user taps "Message owner" on a listing.],
    [Response],
    [The system opens (or reuses) a direct conversation through the standard DM endpoint, which enforces mutual friendship; non-friends are directed to use the Claim request instead.],
    [Comment],
    [Direct messaging requires mutual friendship; the Claim flow (FR25) covers contact with non-friend owners.],
  ),
)
#figure(
  caption: [Message Listing Owner sequence diagram],
  image("../../../assets/Sequence diagrams/21-30/Message Listing Owner sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Mark Listing as Resolved use case diagram],
  image("../../../assets/Use case diagrams/21-30/Mark Listing as Resolved use case diagram.svg"),
)
#figure(
  caption: [Mark Listing as Resolved use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Mark Listing as Resolved use case scenario],
    [Actors], [User (listing owner)],
    [Description],
    [The owner updates a listing's status to "Resolved" once the item is recovered or returned. Resolved items are badged and can no longer be claimed.],
    [Data], [Listing id, authenticated user id],
    [Stimulus], [The owner selects "Mark as resolved".],
    [Response],
    [The system verifies ownership, sets the listing to resolved, persists it, and returns the updated listing; further claims are rejected.],
    [Comment], [Only the listing owner may resolve it.],
  ),
)
#figure(
  caption: [Mark Listing as Resolved sequence diagram],
  image("../../../assets/Sequence diagrams/21-30/Mark Listing as Resolved sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Dispatch Localized Alerts use case diagram],
  image("../../../assets/Use case diagrams/21-30/Dispatch Localized Alerts use case diagram.svg"),
)
#figure(
  caption: [Dispatch Localized Alerts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Dispatch Localized Alerts use case scenario],
    [Actors], [System (triggered by a new listing)],
    [Description],
    [When a new lost or found item is posted, the system automatically notifies all students belonging to the listing's college to increase the chance of recovery.],
    [Data], [Saved listing, owner, college],
    [Stimulus], [A new Lost & Found listing is successfully created (FR23).],
    [Response],
    [The system fetches all users in the listing's college, then dispatches notifications (persisted, real-time, and background push) to each recipient.],
    [Comment], [Fan-out is automatic and excludes the listing's owner.],
  ),
)
#figure(
  caption: [Dispatch Localized Alerts sequence diagram],
  image("../../../assets/Sequence diagrams/21-30/Dispatch Localized Alerts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Block User use case diagram],
  image("../../../assets/Use case diagrams/21-30/Block User use case diagram.svg"),
)
#figure(
  caption: [Block User use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Block User use case scenario],
    [Actors], [User],
    [Description],
    [The user blocks another account. The system automatically severs any existing follow relationships in both directions to ensure immediate privacy.],
    [Data], [Blocker username, blocked username],
    [Stimulus], [The user selects "Block" on a profile or settings entry.],
    [Response],
    [The system rejects self-blocks, persists the block record (if new), removes the FOLLOWS edges in both directions, and adds a BLOCKED edge in the graph.],
    [Comment], [Blocking is symmetric in effect: existing connections are cut both ways.],
  ),
)
#figure(
  caption: [Block User sequence diagram],
  image("../../../assets/Sequence diagrams/21-30/Block User sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Unblock User use case diagram],
  image("../../../assets/Use case diagrams/21-30/Unblock User use case diagram.svg"),
)
#figure(
  caption: [Unblock User use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Unblock User use case scenario],
    [Actors], [User],
    [Description],
    [The user unblocks a previously restricted account, instantly restoring the ability to view profiles and interact normally.],
    [Data], [Blocker username, blocked username],
    [Stimulus], [The user selects "Unblock" from the blocked-accounts list.],
    [Response],
    [The system deletes the block record and removes the BLOCKED edge from the graph; normal interaction is restored.],
    [Comment], [Unblocking does not automatically restore the previously severed follow relationships.],
  ),
)
#figure(
  caption: [Unblock User sequence diagram],
  image("../../../assets/Sequence diagrams/21-30/Unblock User sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [View Blocked Accounts use case diagram],
  image("../../../assets/Use case diagrams/31-40/View Blocked Accounts use case diagram.svg"),
)
#figure(
  caption: [View Blocked Accounts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[View Blocked Accounts use case scenario],
    [Actors], [User],
    [Description],
    [The user navigates to a settings menu to view a chronological list of all the accounts they currently have blocked, showing each user's full name, picture, and the date the block was enacted.],
    [Data], [Authenticated user's username (from JWT principal)],
    [Stimulus], [The user opens the "Blocked accounts" settings entry.],
    [Response],
    [The system resolves the blocker, loads their block records ordered by date descending, and returns each as a blocked-user entry with name, picture, and block date.],
    [Comment], [The list reflects only blocks initiated by the current user.],
  ),
)
#figure(
  caption: [View Blocked Accounts sequence diagram],
  image("../../../assets/Sequence diagrams/31-40/View Blocked Accounts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Enforce Global Blocking Constraints use case diagram],
  image("../../../assets/Use case diagrams/31-40/Enforce Global Blocking Constraints use case diagram.svg"),
)
#figure(
  caption: [Enforce Global Blocking Constraints use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Enforce Global Blocking Constraints use case scenario],
    [Actors], [System (platform-wide enforcement)],
    [Description],
    [If a block exists in either direction, the platform prevents both parties from viewing each other's profiles, messaging, following, or appearing in each other's search results, mutual lists, and friend suggestions.],
    [Data], [Acting user id/username, counterpart id/username],
    [Stimulus], [Any feature operation involving two users (profile, chat, follow, search, mutual, suggestions).],
    [Response],
    [Direct-interaction features call `assertNotBlocked` / `isBlockedEitherWay` and reject when a block exists; listing features fetch `blockedUserIdsFor` and exclude those users (alongside block-aware graph queries).],
    [Comment], [Enforcement is centralized in the Block service and graph queries, applied uniformly across contexts.],
  ),
)
#figure(
  caption: [Enforce Global Blocking Constraints sequence diagram],
  image("../../../assets/Sequence diagrams/31-40/Enforce Global Blocking Constraints sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Create Posts use case diagram],
  image("../../../assets/Use case diagrams/31-40/Create Posts use case diagram.svg"),
)
#figure(
  caption: [Create Posts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Create Posts use case scenario],
    [Actors], [User],
    [Description],
    [The user creates and publishes a post containing a text caption and a mixed gallery of up to 10 photos or videos uploaded from their device.],
    [Data], [Caption (description), up to 10 attachment references (type + URL)],
    [Stimulus], [The user writes a caption, attaches media, and selects "Post".],
    [Response],
    [The system persists the post, stores each attachment, detects and links hashtags from the caption, and returns the created post.],
    [Comment], [Media is uploaded beforehand through the media endpoint, which screens it for NSFW content (FR48).],
  ),
)
#figure(
  caption: [Create Posts sequence diagram],
  image("../../../assets/Sequence diagrams/31-40/Create Posts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Edit Posts use case diagram],
  image("../../../assets/Use case diagrams/31-40/Edit Posts use case diagram.svg"),
)
#figure(
  caption: [Edit Posts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Edit Posts use case scenario],
    [Actors], [User (post owner)],
    [Description],
    [The user modifies the text caption of a previously published post.],
    [Data], [Post id, updated caption],
    [Stimulus], [The owner selects "Edit", changes the caption, and saves.],
    [Response],
    [The system verifies ownership, updates the caption, refreshes the edit timestamp and hashtag links, persists the post, and returns the updated post.],
    [Comment], [Only the post owner may edit; the post is flagged as edited via its updated timestamp.],
  ),
)
#figure(
  caption: [Edit Posts sequence diagram],
  image("../../../assets/Sequence diagrams/31-40/Edit Posts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Delete Posts use case diagram],
  image("../../../assets/Use case diagrams/31-40/Delete Posts use case diagram.svg"),
)
#figure(
  caption: [Delete Posts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Delete Posts use case scenario],
    [Actors], [User (post owner)],
    [Description],
    [The user permanently deletes their own post, removing the content and associated media from the platform.],
    [Data], [Post id],
    [Stimulus], [The owner selects "Delete" and confirms.],
    [Response],
    [The system verifies ownership and deletes the post, cascading removal of its attachments, likes, favorites, comments, hashtag links, and impressions.],
    [Comment], [Deletion is irreversible and cascades to all dependent records.],
  ),
)
#figure(
  caption: [Delete Posts sequence diagram],
  image("../../../assets/Sequence diagrams/31-40/Delete Posts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Browse Home Feed use case diagram],
  image("../../../assets/Use case diagrams/31-40/Browse Home Feed use case diagram.svg"),
)
#figure(
  caption: [Browse Home Feed use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Browse Home Feed use case scenario],
    [Actors], [User],
    [Description],
    [The user scrolls a personalized, continuous home feed that prioritizes relevant posts (from followed peers or same-college users) while filtering out already-seen content.],
    [Data], [Authenticated user id, pagination],
    [Stimulus], [The user opens the home feed and scrolls.],
    [Response],
    [The system gathers candidate posts from the user's network and college, removes posts already marked as seen (impressions), ranks the remainder, and returns a page of posts.],
    [Comment], [Already-seen posts are excluded using recorded impressions.],
  ),
)
#figure(
  caption: [Browse Home Feed sequence diagram],
  image("../../../assets/Sequence diagrams/31-40/Browse Home Feed sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Toggle Post Likes use case diagram],
  image("../../../assets/Use case diagrams/31-40/Toggle Post Likes use case diagram.svg"),
)
#figure(
  caption: [Toggle Post Likes use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Toggle Post Likes use case scenario],
    [Actors], [User],
    [Description],
    [The user likes a post, updating its engagement metrics, and may reverse the action (unlike) at any time.],
    [Data], [Post id, authenticated user id],
    [Stimulus], [The user taps the like control.],
    [Response],
    [If the user already liked the post the system removes the like; otherwise it records the like (notifying the owner) and returns the new liked state and like count.],
    [Comment], [The action is idempotent toggle: like / unlike.],
  ),
)
#figure(
  caption: [Toggle Post Likes sequence diagram],
  image("../../../assets/Sequence diagrams/31-40/Toggle Post Likes sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Save Posts use case diagram],
  image("../../../assets/Use case diagrams/31-40/Save Posts use case diagram.svg"),
)
#figure(
  caption: [Save Posts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Save Posts use case scenario],
    [Actors], [User],
    [Description],
    [The user saves posts to a private bookmark list for later retrieval, and may unsave them.],
    [Data], [Post id, authenticated user id],
    [Stimulus], [The user taps the bookmark control.],
    [Response],
    [If the post is already saved the system removes the favorite; otherwise it records the favorite and returns the new saved state.],
    [Comment], [Saved posts appear in the private "Saved" profile tab (FR11).],
  ),
)
#figure(
  caption: [Save Posts sequence diagram],
  image("../../../assets/Sequence diagrams/31-40/Save Posts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Share Posts use case diagram],
  image("../../../assets/Use case diagrams/31-40/Share Posts use case diagram.svg"),
)
#figure(
  caption: [Share Posts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Share Posts use case scenario],
    [Actors], [User],
    [Description],
    [The user shares a published post directly into existing 1-on-1 or group chats, or generates a unique shareable link to copy to the clipboard.],
    [Data], [Post id; (for chat) conversation id],
    [Stimulus], [The user selects "Share" and chooses "Copy link" or a target chat.],
    [Response],
    [For a link, the system returns a shareable URL the client copies; for a chat, the system stores a post-share message in the conversation.],
    [Comment], [Chat sharing renders a clickable thumbnail preview of the post (FR75).],
  ),
)
#figure(
  caption: [Share Posts sequence diagram],
  image("../../../assets/Sequence diagrams/31-40/Share Posts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Navigate Media Carousels use case diagram],
  image("../../../assets/Use case diagrams/31-40/Navigate Media Carousels use case diagram.svg"),
)
#figure(
  caption: [Navigate Media Carousels use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Navigate Media Carousels use case scenario],
    [Actors], [User],
    [Description],
    [The user swipes or clicks through posts containing multiple images or videos via an interactive carousel, with standard playback and volume controls for video.],
    [Data], [Post attachments (ordered list of media URLs and types)],
    [Stimulus], [The user opens a multi-media post and swipes or taps the carousel.],
    [Response],
    [The client advances the carousel over the attachments returned in the post payload and renders native playback and volume controls for video items.],
    [Comment], [Carousel navigation and playback are handled client-side over the post's attachment list.],
  ),
)
#figure(
  caption: [Navigate Media Carousels sequence diagram],
  image("../../../assets/Sequence diagrams/31-40/Navigate Media Carousels sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Comment on Posts use case diagram],
  image("../../../assets/Use case diagrams/41-50/Comment on Posts use case diagram.svg"),
)
#figure(
  caption: [Comment on Posts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Comment on Posts use case scenario],
    [Actors], [User],
    [Description],
    [The user leaves a top-level text comment on any visible post to participate in public discussion.],
    [Data], [Post id, comment text],
    [Stimulus], [The user types a comment and selects "Send".],
    [Response],
    [The system stores the comment (with no parent), notifies the post owner, and returns the created comment.],
    [Comment], [Top-level comments have no parent comment id.],
  ),
)
#figure(
  caption: [Comment on Posts sequence diagram],
  image("../../../assets/Sequence diagrams/41-50/Comment on Posts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Reply to Comments use case diagram],
  image("../../../assets/Use case diagrams/41-50/Reply to Comments use case diagram.svg"),
)
#figure(
  caption: [Reply to Comments use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Reply to Comments use case scenario],
    [Actors], [User],
    [Description],
    [The user replies directly to an existing comment, creating a nested, hierarchical conversation thread.],
    [Data], [Post id, parent comment id, reply text],
    [Stimulus], [The user taps "Reply" on a comment, types, and sends.],
    [Response],
    [The system links the new comment to its parent, notifies the parent author, and returns the nested reply.],
    [Comment], [Replies use the same create endpoint as FR41, carrying a parent comment id.],
  ),
)
#figure(
  caption: [Reply to Comments sequence diagram],
  image("../../../assets/Sequence diagrams/41-50/Reply to Comments sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Like Comments use case diagram],
  image("../../../assets/Use case diagrams/41-50/Like Comments use case diagram.svg"),
)
#figure(
  caption: [Like Comments use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Like Comments use case scenario],
    [Actors], [User],
    [Description],
    [The user likes an individual comment or reply to show agreement or engagement, and may unlike it.],
    [Data], [Comment id, authenticated user id],
    [Stimulus], [The user taps the like control on a comment.],
    [Response],
    [If already liked the system removes the like; otherwise it records the like (notifying the comment author) and returns the new state with the like count.],
    [Comment], [Idempotent toggle on comments and replies alike.],
  ),
)
#figure(
  caption: [Like Comments sequence diagram],
  image("../../../assets/Sequence diagrams/41-50/Like Comments sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Edit Comments use case diagram],
  image("../../../assets/Use case diagrams/41-50/Edit Comments use case diagram.svg"),
)
#figure(
  caption: [Edit Comments use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Edit Comments use case scenario],
    [Actors], [User (comment author)],
    [Description],
    [The user modifies the text of their own previously submitted comment or reply.],
    [Data], [Comment id, updated text],
    [Stimulus], [The author selects "Edit", changes the text, and saves.],
    [Response], [The system verifies authorship, updates the text and edit timestamp, and returns the updated comment.],
    [Comment], [Only the comment author may edit it.],
  ),
)
#figure(
  caption: [Edit Comments sequence diagram],
  image("../../../assets/Sequence diagrams/41-50/Edit Comments sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Delete Comments use case diagram],
  image("../../../assets/Use case diagrams/41-50/Delete Comments use case diagram.svg"),
)
#figure(
  caption: [Delete Comments use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Delete Comments use case scenario],
    [Actors], [User (comment author)],
    [Description],
    [The user permanently removes their own comment from a post's discussion thread.],
    [Data], [Comment id],
    [Stimulus], [The author selects "Delete" and confirms.],
    [Response],
    [The system verifies authorship and deletes the comment, cascading removal of its replies and comment likes.],
    [Comment], [Deletion cascades to nested replies and likes.],
  ),
)
#figure(
  caption: [Delete Comments sequence diagram],
  image("../../../assets/Sequence diagrams/41-50/Delete Comments sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Discover via Hashtags use case diagram],
  image("../../../assets/Use case diagrams/41-50/Discover via Hashtags use case diagram.svg"),
)
#figure(
  caption: [Discover via Hashtags use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Discover via Hashtags use case scenario],
    [Actors], [User],
    [Description],
    [Hashtags typed in a caption become clickable links; clicking one lets the user discover other posts on that topic.],
    [Data], [Hashtag name, pagination],
    [Stimulus], [The user taps a hashtag link.],
    [Response],
    [The system resolves the hashtag and returns a paginated feed of posts linked to it; an unknown hashtag yields an empty result.],
    [Comment], [Hashtags are detected and linked when a post is created (FR33).],
  ),
)
#figure(
  caption: [Discover via Hashtags sequence diagram],
  image("../../../assets/Sequence diagrams/41-50/Discover via Hashtags sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Report Content use case diagram],
  image("../../../assets/Use case diagrams/41-50/Report Content use case diagram.svg"),
)
#figure(
  caption: [Report Content use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Report Content use case scenario],
    [Actors], [User],
    [Description],
    [The user flags and reports an inappropriate or harmful post, supplying a specific reason to help administrators review it.],
    [Data], [Post id, report reason],
    [Stimulus], [The user selects "Report" on a post and writes a reason.],
    [Response],
    [The system delegates to the Reporting context, which resolves the post and owner, captures the reason, and securely logs the report for administrative review.],
    [Comment], [Reporting is handled by the Reporting & Moderation context (FR92–FR95).],
  ),
)
#figure(
  caption: [Report Content sequence diagram],
  image("../../../assets/Sequence diagrams/41-50/Report Content sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Filter Inappropriate Media use case diagram],
  image("../../../assets/Use case diagrams/41-50/Filter Inappropriate Media use case diagram.svg"),
)
#figure(
  caption: [Filter Inappropriate Media use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Filter Inappropriate Media use case scenario],
    [Actors], [System (media pipeline)],
    [Description],
    [The system should analyze uploaded media for NSFW content; if detected, it should strip the offending media and publish the post with only the text description.],
    [Data], [Uploaded file bytes, filename, content type],
    [Stimulus], [The user uploads media while composing a post.],
    [Response],
    [The current pipeline validates type and size, normalizes/resizes images, and uploads to the media store (Cloudinary), returning hosted URLs.],
    [Comment],
    [*Not implemented in the current backend:* `MediaUploadService` performs validation, normalization, and upload only — there is no NSFW analysis or auto-strip / text-only fallback in code. Automated moderation would be configured at the Cloudinary moderation add-on / upload-preset level or added as a moderation step in this pipeline.],
  ),
)
#figure(
  caption: [Filter Inappropriate Media sequence diagram],
  image("../../../assets/Sequence diagrams/41-50/Filter Inappropriate Media sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Display Ads on Feed use case diagram],
  image("../../../assets/Use case diagrams/41-50/Clickable ads and Display ads on feed.svg"),
)
#figure(
  caption: [Display Ads on Feed use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Display Ads on Feed use case scenario],
    [Actors], [User, Ad Provider (ST3)],
    [Description],
    [The user views advertisements dynamically placed within their feed.],
    [Data], [Ad creatives (advertiser name, ad content, redirect URL)],
    [Stimulus], [The user scrolls the feed.],
    [Response],
    [The client interleaves ad units among feed posts (per the specified design, sourced from an external ad provider).],
    [Comment],
    [*Not implemented in the current backend:* there is no Advertising context, controller, service, or entity in the current code (the earlier `Ad` design was removed). This scenario documents the specified behavior only.],
  ),
)
#figure(
  caption: [Display Ads on Feed sequence diagram],
  image("../../../assets/Sequence diagrams/41-50/Display Ads on Feed sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------

// TODO: LOOK INTO IT
//#figure(
 // caption: [Clickable Ads use case diagram],
  //image("../../../assets/Use case diagrams/41-50/Clickable Ads use case diagram.svg"),
//)
#figure(
  caption: [Clickable Ads use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Clickable Ads use case scenario],
    [Actors], [User, Ad Provider (ST3)],
    [Description],
    [The user clicks an ad and is taken to the ad provider's external website.],
    [Data], [Ad redirect URL],
    [Stimulus], [The user taps an ad in the feed.],
    [Response], [The client registers the click with the provider and opens the advertiser's external site.],
    [Comment],
    [*Not implemented in the current backend:* no Advertising context exists; documents the specified behavior only.],
  ),
)
#figure(
  caption: [Clickable Ads sequence diagram],
  image("../../../assets/Sequence diagrams/41-50/Clickable Ads sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Report Ad use case diagram],
  image("../../../assets/Use case diagrams/51-60/Report Ad use case diagram.svg"),
)
#figure(
  caption: [Report Ad use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Report Ad use case scenario],
    [Actors], [User, Ad Provider (ST3)],
    [Description],
    [The user reports an advertisement they determine to be NSFW or inappropriate for the platform.],
    [Data], [Ad identifier, report reason],
    [Stimulus], [The user selects "Report ad" and writes a reason.],
    [Response], [Per the specified design, the report would be captured and escalated for review.],
    [Comment],
    [*Not implemented in the current backend:* there is no Advertising context, and `ReportTargetType` supports only USER, POST, and MESSAGE (no AD). Documents the specified behavior only.],
  ),
)
#figure(
  caption: [Report Ad sequence diagram],
  image("../../../assets/Sequence diagrams/51-60/Report Ad sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Search Globally use case diagram],
  image("../../../assets/Use case diagrams/51-60/Search Globally use case diagram.svg"),
)
#figure(
  caption: [Search Globally use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Search Globally use case scenario],
    [Actors], [User],
    [Description],
    [The user enters a query into the master search bar to search the whole platform at once, returning a summary of relevant users, posts, and hashtags.],
    [Data], [Query string, pagination, current user (JWT principal)],
    [Stimulus], [The user types a query into the global search bar.],
    [Response],
    [The system resolves the current user id, runs fuzzy, block-aware searches across users, posts, and hashtags, and returns a combined summary.],
    [Comment], [Aggregates the three category searches behind a single endpoint.],
  ),
)
#figure(
  caption: [Search Globally sequence diagram],
  image("../../../assets/Sequence diagrams/51-60/Search Globally sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Filter by Category use case diagram],
  image("../../../assets/Use case diagrams/51-60/Filter by Category use case diagram.svg"),
)
#figure(
  caption: [Filter by Category use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Filter by Category use case scenario],
    [Actors], [User],
    [Description],
    [The user filters search results by selecting dedicated category tabs (All, Users, Posts, Hashtags) to narrow the content type.],
    [Data], [Query string, selected category, pagination],
    [Stimulus], [The user selects a category tab.],
    [Response],
    [The system routes to the matching category endpoint (users / posts / hashtags) and returns the paginated results for that type.],
    [Comment], [Each category tab maps to a dedicated search endpoint.],
  ),
)
#figure(
  caption: [Filter by Category sequence diagram],
  image("../../../assets/Sequence diagrams/51-60/Filter by Category sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Process Partial Queries use case diagram],
  image("../../../assets/Use case diagrams/51-60/Process Partial Queries use case diagram.svg"),
)
#figure(
  caption: [Process Partial Queries use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Process Partial Queries use case scenario],
    [Actors], [User],
    [Description],
    [The search engine is forgiving, letting users find peers or content with incomplete names or minor spelling mistakes.],
    [Data], [Partial or misspelled query string],
    [Stimulus], [The user types an incomplete or misspelled query.],
    [Response],
    [The system matches using case-insensitive substring matching and PostgreSQL trigram similarity, ordering results by closeness so near-matches still surface.],
    [Comment], [Backed by `pg_trgm` (the `%` operator and `similarity()` ordering) in the native search queries.],
  ),
)
#figure(
  caption: [Process Partial Queries sequence diagram],
  image("../../../assets/Sequence diagrams/51-60/Process Partial Queries sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Display Live Results use case diagram],
  image("../../../assets/Use case diagrams/51-60/Display Live Results use case diagram.svg"),
)
#figure(
  caption: [Display Live Results use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Display Live Results use case scenario],
    [Actors], [User],
    [Description],
    [The system provides a dynamic search experience, fetching and updating results in real time as the user types, with no submit button.],
    [Data], [Query string (updated per keystroke), pagination],
    [Stimulus], [The user types in the search bar.],
    [Response],
    [The client issues a debounced request per keystroke, cancels stale responses, and replaces the displayed results as new ones arrive.],
    [Comment], [Live behavior is client-driven (debounce + cancellation) over the standard search endpoints.],
  ),
)
#figure(
  caption: [Display Live Results sequence diagram],
  image("../../../assets/Sequence diagrams/51-60/Display Live Results sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Enforce Search Privacy use case diagram],
  image("../../../assets/Use case diagrams/51-60/Enforce Search Privacy use case diagram.svg"),
)
#figure(
  caption: [Enforce Search Privacy use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Enforce Search Privacy use case scenario],
    [Actors], [System (search privacy)],
    [Description],
    [The search system respects privacy: if a user has blocked someone or been blocked by them, that person is hidden from all search results.],
    [Data], [Query string, current user id],
    [Stimulus], [Any user search is executed.],
    [Response],
    [The native query excludes the current user and any account where a block exists in either direction (via a `NOT EXISTS` check against `user_blocks`).],
    [Comment], [Privacy is enforced inside the query itself, not by post-filtering.],
  ),
)
#figure(
  caption: [Enforce Search Privacy sequence diagram],
  image("../../../assets/Sequence diagrams/51-60/Enforce Search Privacy sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Discover via Hashtags (Search) use case diagram],
  image("../../../assets/Use case diagrams/51-60/Discover via Hashtags (Search) use case diagram.svg"),
)
#figure(
  caption: [Discover via Hashtags (Search) use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Discover via Hashtags (Search) use case scenario],
    [Actors], [User],
    [Description],
    [The user clicks any hashtag across the platform to trigger a dedicated search, displaying posts associated with that topic.],
    [Data], [Hashtag name, pagination],
    [Stimulus], [The user taps a hashtag link anywhere on the platform.],
    [Response], [The system runs a hashtag search and opens the topic feed of associated posts.],
    [Comment], [Complements the post-context hashtag feed (FR46).],
  ),
)
#figure(
  caption: [Discover via Hashtags (Search) sequence diagram],
  image("../../../assets/Sequence diagrams/51-60/Discover via Hashtags sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Create Direct Messages use case diagram],
  image("../../../assets/Use case diagrams/51-60/Create Direct Messages use case diagram.svg"),
)
#figure(
  caption: [Create Direct Messages use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Create Direct Messages use case scenario],
    [Actors], [User],
    [Description],
    [The user initiates a private 1-on-1 conversation. Conversation creation is restricted to mutual friends to prevent spam.],
    [Data], [Requester username, target username],
    [Stimulus], [The user starts a new direct message with another user.],
    [Response],
    [The system asserts mutual friendship, then returns an existing DM or creates and returns a new one with both members.],
    [Comment], [Restricted to mutual friends via the friendship validator.],
  ),
)
#figure(
  caption: [Create Direct Messages sequence diagram],
  image("../../../assets/Sequence diagrams/51-60/Create Direct Messages sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Create Group Chats use case diagram],
  image("../../../assets/Use case diagrams/51-60/Create Group Chats use case diagram.svg"),
)
#figure(
  caption: [Create Group Chats use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Create Group Chats use case scenario],
    [Actors], [User (creator)],
    [Description],
    [The user creates a multi-user group chat by selecting multiple mutual friends; the creator is automatically designated as group administrator.],
    [Data], [Group name, selected mutual-friend usernames],
    [Stimulus], [The user names the group, selects members, and taps "Create".],
    [Response],
    [The system validates that every selected member is a mutual friend, creates the group with the creator as admin and others as members, notifies members, and returns the group.],
    [Comment], [Every member must be a mutual friend of the creator; the creator is the initial admin.],
  ),
)
#figure(
  caption: [Create Group Chats sequence diagram],
  image("../../../assets/Sequence diagrams/51-60/Create Group Chats sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Search Friends Real-Time use case diagram],
  image("../../../assets/Use case diagrams/51-60/Search Friends Real-Time use case diagram.svg"),
)
#figure(
  caption: [Search Friends Real-Time use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Search Friends Real-Time use case scenario],
    [Actors], [User],
    [Description],
    [The user searches their mutual-friends list in real time, with results updating instantly while typing, when starting a DM or adding members to a group.],
    [Data], [Current username, search text],
    [Stimulus], [The user types in the friend-picker search box.],
    [Response],
    [The system loads the user's block-aware mutual-friends list; the client filters it by name and username instantly as the user types.],
    [Comment], [Filtering is client-side over the fetched mutual-friends list.],
  ),
)
#figure(
  caption: [Search Friends Real-Time sequence diagram],
  image("../../../assets/Sequence diagrams/51-60/Search Friends Real-Time sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Send Text Messages use case diagram],
  image("../../../assets/Use case diagrams/61-70/Send Text Messages use case diagram.svg"),
)
#figure(
  caption: [Send Text Messages use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Send Text Messages use case scenario],
    [Actors], [User (conversation member)],
    [Description],
    [The user types and sends a standard text message within any active 1-on-1 or group conversation.],
    [Data], [Conversation id, message text],
    [Stimulus], [The user types a message and sends it.],
    [Response],
    [The system validates membership, persists a TEXT message, broadcasts it to the conversation topic, and notifies recipients.],
    [Comment], [Delivered in real time over WebSocket; recipients receive a NEW_MESSAGE notification.],
  ),
)
#figure(
  caption: [Send Text Messages sequence diagram],
  image("../../../assets/Sequence diagrams/61-70/Send Text Messages sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Send Media and Files use case diagram],
  image("../../../assets/Use case diagrams/61-70/Send Media and Files use case diagram.svg"),
)
#figure(
  caption: [Send Media and Files use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Send Media and Files use case scenario],
    [Actors], [User (conversation member)],
    [Description],
    [The user uploads and sends documents (PDF, Word), photos, and videos directly into the chat timeline.],
    [Data], [Conversation id, file bytes, content type],
    [Stimulus], [The user attaches a file and sends it.],
    [Response],
    [The system uploads the file to storage, persists a typed media message (IMAGE/VIDEO/FILE), and broadcasts it to the conversation.],
    [Comment], [Media type is derived from the content type; uploads go through the media/storage service.],
  ),
)
#figure(
  caption: [Send Media and Files sequence diagram],
  image("../../../assets/Sequence diagrams/61-70/Send Media and Files sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Record Voice Messages use case diagram],
  image("../../../assets/Use case diagrams/61-70/Record Voice Messages use case diagram.svg"),
)
#figure(
  caption: [Record Voice Messages use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Record Voice Messages use case scenario],
    [Actors], [User (conversation member)],
    [Description],
    [The user records live audio with the built-in microphone tool and sends it as a voice message.],
    [Data], [Conversation id, recorded audio bytes],
    [Stimulus], [The user records audio and sends it.],
    [Response],
    [The client uploads the recorded audio; the system persists an AUDIO message and broadcasts it to the conversation.],
    [Comment], [Recording is captured client-side; delivery reuses the media-message path.],
  ),
)
#figure(
  caption: [Record Voice Messages sequence diagram],
  image("../../../assets/Sequence diagrams/61-70/Record Voice Messages sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Play Voice Messages use case diagram],
  image("../../../assets/Use case diagrams/61-70/Play Voice Messages use case diagram.svg"),
)
#figure(
  caption: [Play Voice Messages use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Play Voice Messages use case scenario],
    [Actors], [User],
    [Description],
    [The user plays a received voice message; the interface shows a playback slider that tracks duration and remaining seconds in real time.],
    [Data], [Audio message URL],
    [Stimulus], [The user taps play on a voice message.],
    [Response], [The client streams the audio URL and renders a live playback slider.],
    [Comment], [Playback and slider are handled client-side over the stored audio URL.],
  ),
)
#figure(
  caption: [Play Voice Messages sequence diagram],
  image("../../../assets/Sequence diagrams/61-70/Play Voice Messages sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Display Message Timestamps use case diagram],
  image("../../../assets/Use case diagrams/61-70/Display Message Timestamps use case diagram.svg"),
)
#figure(
  caption: [Display Message Timestamps use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Display Message Timestamps use case scenario],
    [Actors], [User],
    [Description],
    [The system organizes the chat timeline with pill-shaped date/time dividers (e.g. "Yesterday, 17:27") between messages.],
    [Data], [Message timestamps],
    [Stimulus], [The user views a conversation.],
    [Response], [The client groups messages by date and renders dividers based on each message's stored timestamp.],
    [Comment], [Dividers are computed client-side from message timestamps returned by the history endpoint.],
  ),
)
#figure(
  caption: [Display Message Timestamps sequence diagram],
  image("../../../assets/Sequence diagrams/61-70/Display Message Timestamps sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Display Typing Indicators use case diagram],
  image("../../../assets/Use case diagrams/61-70/Display Typing Indicators use case diagram.svg"),
)
#figure(
  caption: [Display Typing Indicators use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Display Typing Indicators use case scenario],
    [Actors], [User (conversation member)],
    [Description],
    [The system shows live animated dots when another member is actively composing a message.],
    [Data], [Conversation id, username, typing flag],
    [Stimulus], [A member begins or stops typing.],
    [Response],
    [The client publishes a typing event over WebSocket; the server broadcasts it to the conversation's typing topic so other members see the indicator.],
    [Comment], [Sent to `/app/chat.typing`, broadcast on `/topic/conversations/{id}/typing`.],
  ),
)
#figure(
  caption: [Display Typing Indicators sequence diagram],
  image("../../../assets/Sequence diagrams/61-70/Display Typing Indicators sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Display Read Receipts use case diagram],
  image("../../../assets/Use case diagrams/61-70/Display Read Receipts use case diagram.svg"),
)
#figure(
  caption: [Display Read Receipts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Display Read Receipts use case scenario],
    [Actors], [User (conversation member)],
    [Description],
    [The system shows indicators (checkmarks) when a sent message has been delivered to and read by recipients.],
    [Data], [Conversation id, last read message id],
    [Stimulus], [The recipient opens/scrolls the conversation.],
    [Response],
    [The system records a read receipt, marks messages read, broadcasts a read event to the conversation, and clears that conversation's unread message notifications.],
    [Comment],
    [Read events broadcast on `/topic/conversations/{id}/read`; opening a chat clears its message notifications (FR89).],
  ),
)
#figure(
  caption: [Display Read Receipts sequence diagram],
  image("../../../assets/Sequence diagrams/61-70/Display Read Receipts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Edit Messages use case diagram],
  image("../../../assets/Use case diagrams/61-70/Edit Messages use case diagram.svg"),
)
#figure(
  caption: [Edit Messages use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Edit Messages use case scenario],
    [Actors], [User (message sender)],
    [Description],
    [The user modifies the text of their own previously sent message, appending an "(edited)" flag.],
    [Data], [Message id, new text],
    [Stimulus], [The sender edits a message and saves.],
    [Response],
    [The system verifies the sender, that the message is text and not deleted, updates the content and edit timestamp, and broadcasts an EDIT_MESSAGE event.],
    [Comment], [Only the sender may edit; only text messages can be edited.],
  ),
)
#figure(
  caption: [Edit Messages sequence diagram],
  image("../../../assets/Sequence diagrams/61-70/Edit Messages sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Delete Personal Messages use case diagram],
  image("../../../assets/Use case diagrams/61-70/Delete Personal Messages use case diagram.svg"),
)
#figure(
  caption: [Delete Personal Messages use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Delete Personal Messages use case scenario],
    [Actors], [User (message sender)],
    [Description],
    [The user deletes their own message, replacing the original content with a "message deleted" placeholder.],
    [Data], [Message id],
    [Stimulus], [The sender deletes a message.],
    [Response],
    [The system verifies authorization, flags the message as deleted, and broadcasts a DELETE_MESSAGE event so clients render the placeholder.],
    [Comment], [The record is retained but flagged deleted (soft delete) for placeholder rendering.],
  ),
)
#figure(
  caption: [Delete Personal Messages sequence diagram],
  image("../../../assets/Sequence diagrams/61-70/Delete Personal Messages sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Update Group Details use case diagram],
  image("../../../assets/Use case diagrams/61-70/Update Group Details use case diagram.svg"),
)
#figure(
  caption: [Update Group Details use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Update Group Details use case scenario],
    [Actors], [User (group administrator)],
    [Description],
    [An admin edits the group chat's display name and uploads a new group picture.],
    [Data], [Conversation id, new group name, new picture],
    [Stimulus], [The admin saves updated group details.],
    [Response],
    [The system verifies admin rights, uploads any new picture, updates the group name/picture, and returns the updated group.],
    [Comment], [Admin-only operation.],
  ),
)
#figure(
  caption: [Update Group Details sequence diagram],
  image("../../../assets/Sequence diagrams/61-70/Update Group Details sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Add Group Members use case diagram],
  image("../../../assets/Use case diagrams/71-80/Add Group Members use case diagram.svg"),
)
#figure(
  caption: [Add Group Members use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Add Group Members use case scenario],
    [Actors], [User (group administrator)],
    [Description],
    [An admin searches for and invites additional mutual friends to an existing group chat.],
    [Data], [Conversation id, member usernames],
    [Stimulus], [The admin adds members.],
    [Response],
    [The system verifies admin rights, asserts each new member is a mutual friend, adds them, and notifies them.],
    [Comment], [Admin-only; every added member must be a mutual friend of the admin.],
  ),
)
#figure(
  caption: [Add Group Members sequence diagram],
  image("../../../assets/Sequence diagrams/71-80/Add Group Members sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Remove Group Members use case diagram],
  image("../../../assets/Use case diagrams/71-80/Remove Group Members use case diagram.svg"),
)
#figure(
  caption: [Remove Group Members use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Remove Group Members use case scenario],
    [Actors], [User (group administrator)],
    [Description],
    [An admin removes existing members from a group chat.],
    [Data], [Conversation id, target username],
    [Stimulus], [The admin removes a member.],
    [Response], [The system verifies admin rights and removes the target member from the group.],
    [Comment], [Admin-only operation.],
  ),
)
#figure(
  caption: [Remove Group Members sequence diagram],
  image("../../../assets/Sequence diagrams/71-80/Remove Group Members sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Manage Group Admins use case diagram],
  image("../../../assets/Use case diagrams/71-80/Manage Group Admins use case diagram.svg"),
)
#figure(
  caption: [Manage Group Admins use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Manage Group Admins use case scenario],
    [Actors], [User (group administrator)],
    [Description],
    [An admin promotes members to admin status or demotes existing admins back to members.],
    [Data], [Conversation id, target username, admin flag],
    [Stimulus], [The admin changes a member's role.],
    [Response],
    [The system verifies admin rights, prevents demoting the last admin, and updates the target's admin flag.],
    [Comment], [The group cannot be left without at least one admin.],
  ),
)
#figure(
  caption: [Manage Group Admins sequence diagram],
  image("../../../assets/Sequence diagrams/71-80/Manage Group Admins sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Leave Group use case diagram],
  image("../../../assets/Use case diagrams/71-80/Leave Group use case diagram.svg"),
)
#figure(
  caption: [Leave Group use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Leave Group use case scenario],
    [Actors], [User (group member)],
    [Description],
    [The user voluntarily leaves a group chat. If the user is the sole admin, the system blocks the action to prevent an orphaned group.],
    [Data], [Conversation id],
    [Stimulus], [The user selects "Leave group".],
    [Response],
    [The system removes the member, unless they are the last remaining admin, in which case it rejects the request.],
    [Comment], [A sole admin must delegate admin before leaving.],
  ),
)
#figure(
  caption: [Leave Group sequence diagram],
  image("../../../assets/Sequence diagrams/71-80/Leave Group sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Share Posts to Chat use case diagram],
  image("../../../assets/Use case diagrams/71-80/Share Posts to Chat use case diagram.svg"),
)
#figure(
  caption: [Share Posts to Chat use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Share Posts to Chat use case scenario],
    [Actors], [User (conversation member)],
    [Description],
    [The user shares a published post into a chat; a clickable thumbnail preview is rendered in the message flow.],
    [Data], [Conversation id, shared post id],
    [Stimulus], [The user shares a post into a conversation.],
    [Response],
    [The system persists a POST_SHARE message referencing the post and broadcasts it; clients render a thumbnail preview.],
    [Comment], [Message type POST_SHARE carries the shared post id.],
  ),
)
#figure(
  caption: [Share Posts to Chat sequence diagram],
  image("../../../assets/Sequence diagrams/71-80/Share Posts to Chat sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Initiate Calls from Chat use case diagram],
  image("../../../assets/Use case diagrams/71-80/Initiate Calls from Chat use case diagram.svg"),
)
#figure(
  caption: [Initiate Calls from Chat use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Initiate Calls from Chat use case scenario],
    [Actors], [User (conversation member)],
    [Description],
    [The user taps header icons in the chat to instantly start a live audio or video call with the participants.],
    [Data], [Conversation id, call type (audio/video)],
    [Stimulus], [The user taps the call icon in the chat header.],
    [Response], [The system starts the appropriate call session for the conversation and rings the participants.],
    [Comment], [Entry point into the call-initiation flow (FR77).],
  ),
)
#figure(
  caption: [Initiate Calls from Chat sequence diagram],
  image("../../../assets/Sequence diagrams/71-80/Initiate Calls from Chat sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Initiate Calls use case diagram],
  image("../../../assets/Use case diagrams/71-80/Initiate Calls use case diagram.svg"),
)
#figure(
  caption: [Initiate Calls use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Initiate Calls use case scenario],
    [Actors], [User],
    [Description],
    [The user starts a live audio-only or video call from any 1-on-1 or group chat. Calling is restricted to mutual friends.],
    [Data], [Conversation id / target(s), call type, scope (direct/group)],
    [Stimulus], [The user initiates a call.],
    [Response],
    [The system verifies mutual friendship, creates a RINGING call session with participants, and broadcasts an incoming-call event to the callee(s).],
    [Comment], [Restricted to mutual friends via the friendship validator.],
  ),
)
#figure(
  caption: [Initiate Calls sequence diagram],
  image("../../../assets/Sequence diagrams/71-80/Initiate Calls sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Display Incoming Call Alerts use case diagram],
  image("../../../assets/Use case diagrams/71-80/Display Incoming Call Alerts use case diagram.svg"),
)
#figure(
  caption: [Display Incoming Call Alerts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Display Incoming Call Alerts use case scenario],
    [Actors], [User (callee)],
    [Description],
    [The system provides global real-time incoming-call notifications with a ringtone and a pop-up showing the caller's name and picture, regardless of the current page.],
    [Data], [Call event (caller, room, type)],
    [Stimulus], [An incoming call session is created for the user.],
    [Response],
    [The server broadcasts a call event over WebSocket to the callee, which the client renders globally with a ringtone and accept/decline pop-up.],
    [Comment], [Delivered via the call event channel; rendered globally by the client shell.],
  ),
)
#figure(
  caption: [Display Incoming Call Alerts sequence diagram],
  image("../../../assets/Sequence diagrams/71-80/Display Incoming Call Alerts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Accept Calls use case diagram],
  image("../../../assets/Use case diagrams/71-80/Accept Calls use case diagram.svg"),
)
#figure(
  caption: [Accept Calls use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Accept Calls use case scenario],
    [Actors], [User (callee)],
    [Description],
    [The user accepts an incoming call to instantly join the live video or audio meeting room.],
    [Data], [Call id],
    [Stimulus], [The user taps "Accept".],
    [Response],
    [The system marks the participant accepted, sets the call accepted, broadcasts the update, and the client joins the room.],
    [Comment], [Joins the media room on acceptance.],
  ),
)
#figure(
  caption: [Accept Calls sequence diagram],
  image("../../../assets/Sequence diagrams/71-80/Accept Calls sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Decline Calls use case diagram],
  image("../../../assets/Use case diagrams/71-80/Decline Calls use case diagram.svg"),
)
#figure(
  caption: [Decline Calls use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Decline Calls use case scenario],
    [Actors], [User (callee)],
    [Description],
    [The user declines an incoming call, dismissing the ringing alert and notifying the caller.],
    [Data], [Call id],
    [Stimulus], [The user taps "Decline".],
    [Response], [The system marks the participant declined and broadcasts the decline so the caller is notified.],
    [Comment], [Dismisses the alert for the callee and informs the caller.],
  ),
)
#figure(
  caption: [Decline Calls sequence diagram],
  image("../../../assets/Sequence diagrams/71-80/Decline Calls sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Cancel Outgoing Calls use case diagram],
  image("../../../assets/Use case diagrams/81-90/Cancel Outgoing Calls use case diagram.svg"),
)
#figure(
  caption: [Cancel Outgoing Calls use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Cancel Outgoing Calls use case scenario],
    [Actors], [User (caller)],
    [Description],
    [The caller manually cancels an outgoing call attempt before the recipient answers.],
    [Data], [Call id],
    [Stimulus], [The caller taps "Cancel".],
    [Response], [The system sets the call cancelled and broadcasts the cancellation to the callee(s).],
    [Comment], [Triggers a missed-call notification for the callee (FR83).],
  ),
)
#figure(
  caption: [Cancel Outgoing Calls sequence diagram],
  image("../../../assets/Sequence diagrams/81-90/Cancel Outgoing Calls sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Timeout Unanswered Calls use case diagram],
  image("../../../assets/Use case diagrams/81-90/Timeout Unanswered Calls use case diagram.svg"),
)
#figure(
  caption: [Timeout Unanswered Calls use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Timeout Unanswered Calls use case scenario],
    [Actors], [System (scheduler)],
    [Description],
    [The system automatically terminates call attempts that ring for too long without being answered.],
    [Data], [Ringing call sessions, expiry time],
    [Stimulus], [A scheduled check runs while calls are ringing.],
    [Response], [The system finds RINGING sessions past their expiry, marks them MISSED, and broadcasts termination.],
    [Comment], [Implemented by the scheduled `expireRingingCalls` routine.],
  ),
)
#figure(
  caption: [Timeout Unanswered Calls sequence diagram],
  image("../../../assets/Sequence diagrams/81-90/Timeout Unanswered Calls sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Dispatch Missed Call Alerts use case diagram],
  image("../../../assets/Use case diagrams/81-90/Dispatch Missed Call Alerts use case diagram.svg"),
)
#figure(
  caption: [Dispatch Missed Call Alerts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Dispatch Missed Call Alerts use case scenario],
    [Actors], [System],
    [Description],
    [The system generates and delivers a "Missed Call" notification when an incoming call times out or is cancelled before being answered.],
    [Data], [Call session, recipient],
    [Stimulus], [A call is cancelled or times out unanswered.],
    [Response],
    [The system records the participant as missed and dispatches a missed-call notification to the recipient.],
    [Comment], [Triggered by cancel (FR81) and timeout (FR82).],
  ),
)
#figure(
  caption: [Dispatch Missed Call Alerts sequence diagram],
  image("../../../assets/Sequence diagrams/81-90/Dispatch Missed Call Alerts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Minimize Call Window use case diagram],
  image("../../../assets/Use case diagrams/81-90/Minimize Call Window use case diagram.svg"),
)
#figure(
  caption: [Minimize Call Window use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Minimize Call Window use case scenario],
    [Actors], [User (in call)],
    [Description],
    [The user minimizes the active video meeting into a floating, draggable Picture-in-Picture window to keep browsing while staying in the call.],
    [Data], [Active call session (client state)],
    [Stimulus], [The user taps "Minimize".],
    [Response], [The client renders a draggable PiP window while maintaining the live media connection.],
    [Comment], [Handled client-side; the media session continues uninterrupted.],
  ),
)
#figure(
  caption: [Minimize Call Window sequence diagram],
  image("../../../assets/Sequence diagrams/81-90/Minimize Call Window sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Toggle In-Call Controls use case diagram],
  image("../../../assets/Use case diagrams/81-90/Toggle In-Call Controls use case diagram.svg"),
)
#figure(
  caption: [Toggle In-Call Controls use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Toggle In-Call Controls use case scenario],
    [Actors], [User (in call)],
    [Description],
    [The call interface provides standard controls: mute/unmute mic, toggle camera, switch to grid/tile view, and hang up.],
    [Data], [Active call session, control toggles],
    [Stimulus], [The user taps a call control.],
    [Response], [The client toggles the local media tracks or layout; hanging up ends the call session on the server.],
    [Comment], [Media toggles are client-side; "hang up" calls the end-call endpoint.],
  ),
)
#figure(
  caption: [Toggle In-Call Controls sequence diagram],
  image("../../../assets/Sequence diagrams/81-90/Toggle In-Call Controls sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Receive Real-Time Alerts use case diagram],
  image("../../../assets/Use case diagrams/81-90/Receive Real-Time Alerts use case diagram.svg"),
)
#figure(
  caption: [Receive Real-Time Alerts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Receive Real-Time Alerts use case scenario],
    [Actors], [System],
    [Description],
    [The system delivers instant live notifications for platform activity (likes, comments, follows, messages, Lost & Found claims) and dispatches background push notifications via the browser.],
    [Data], [Recipient, actor, notification type, target, message],
    [Stimulus], [A notifiable event occurs (like, comment, follow, message, claim).],
    [Response],
    [The system persists the notification, pushes it in real time over WebSocket, and dispatches a background browser push.],
    [Comment], [Central dispatch used by all contexts.],
  ),
)
#figure(
  caption: [Receive Real-Time Alerts sequence diagram],
  image("../../../assets/Sequence diagrams/81-90/Receive Real-Time Alerts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Filter Notifications use case diagram],
  image("../../../assets/Use case diagrams/81-90/Filter Notifications use case diagram.svg"),
)
#figure(
  caption: [Filter Notifications use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Filter Notifications use case scenario],
    [Actors], [User],
    [Description],
    [The user accesses a centralized notification feed organized into filterable tabs (All, Interactions, Follows, Lost & Found, Messages).],
    [Data], [Notification feed, selected tab],
    [Stimulus], [The user opens the notification hub and selects a tab.],
    [Response], [The system returns the notification feed; the client organizes alerts into tabs by notification type.],
    [Comment], [Tab grouping is performed client-side by notification type.],
  ),
)
#figure(
  caption: [Filter Notifications sequence diagram],
  image("../../../assets/Sequence diagrams/81-90/Filter Notifications sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Preview Target Content use case diagram],
  image("../../../assets/Use case diagrams/81-90/Preview Target Content use case diagram.svg"),
)
#figure(
  caption: [Preview Target Content use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Preview Target Content use case scenario],
    [Actors], [User],
    [Description],
    [The user clicks a notification to jump to the relevant context (profile, chat, item); post-related notifications render a thumbnail preview.],
    [Data], [Notification (target type, target id, metadata)],
    [Stimulus], [The user taps a notification card.],
    [Response],
    [The client routes to the target context; for post interactions it renders a thumbnail from the notification metadata.],
    [Comment], [Target type/id and metadata drive navigation and previews.],
  ),
)
#figure(
  caption: [Preview Target Content sequence diagram],
  image("../../../assets/Sequence diagrams/81-90/Preview Target Content sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Update Unread Status use case diagram],
  image("../../../assets/Use case diagrams/81-90/Update Unread Status use case diagram.svg"),
)
#figure(
  caption: [Update Unread Status use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Update Unread Status use case scenario],
    [Actors], [User],
    [Description],
    [A badge shows the unread count; the user can mark items read individually or all at once, and opening a chat auto-clears its message alerts.],
    [Data], [Unread count, notification id (or all)],
    [Stimulus], [The user views the badge, marks read, or opens a chat.],
    [Response],
    [The system returns the unread count, flips notifications to read on demand, and automatically clears a conversation's message notifications when the chat is opened.],
    [Comment], [Auto-clear is triggered by the read-receipt flow (FR67).],
  ),
)
#figure(
  caption: [Update Unread Status sequence diagram],
  image("../../../assets/Sequence diagrams/81-90/Update Unread Status sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Delete Notifications Manually use case diagram],
  image("../../../assets/Use case diagrams/81-90/Delete Notifications Manually use case diagram.svg"),
)
#figure(
  caption: [Delete Notifications Manually use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Delete Notifications Manually use case scenario],
    [Actors], [User],
    [Description],
    [The user manually dismisses and deletes specific notifications from their feed without opening them.],
    [Data], [Notification id],
    [Stimulus], [The user dismisses a notification.],
    [Response], [The system permanently deletes the specified notification.],
    [Comment], [Distinct from marking read; this removes the record.],
  ),
)
#figure(
  caption: [Delete Notifications Manually sequence diagram],
  image("../../../assets/Sequence diagrams/81-90/Delete Notifications Manually sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Auto-Delete Read Alerts use case diagram],
  image("../../../assets/Use case diagrams/91-99/Auto-Delete Read Alerts use case diagram.svg"),
)
#figure(
  caption: [Auto-Delete Read Alerts use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Auto-Delete Read Alerts use case scenario],
    [Actors], [System],
    [Description],
    [The notification hub acts as an ephemeral inbox: a notification is removed from the feed the moment it is marked read or clicked, leaving only pending unread alerts.],
    [Data], [Notification read state],
    [Stimulus], [A notification is marked read or clicked.],
    [Response],
    [The feed returns only unread notifications, so flipping an alert to read excludes it from the displayed feed.],
    [Comment], [Ephemeral behavior achieved by serving unread-only notifications.],
  ),
)
#figure(
  caption: [Auto-Delete Read Alerts sequence diagram],
  image("../../../assets/Sequence diagrams/91-99/Auto-Delete Read Alerts sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Report Platform Entities use case diagram],
  image("../../../assets/Use case diagrams/91-99/Report Platform Entities use case diagram.svg"),
)
#figure(
  caption: [Report Platform Entities use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Report Platform Entities use case scenario],
    [Actors], [User],
    [Description],
    [The user reports user profiles, feed posts, and individual chat messages that violate community guidelines.],
    [Data], [Target type (USER/POST/MESSAGE), target id, reason],
    [Stimulus], [The user reports an entity.],
    [Response], [The system resolves the target by type, captures the report, and escalates it for review.],
    [Comment], [Supported target types: USER, POST, MESSAGE.],
  ),
)
#figure(
  caption: [Report Platform Entities sequence diagram],
  image("../../../assets/Sequence diagrams/91-99/Report Platform Entities sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Submit Report Reason use case diagram],
  image("../../../assets/Use case diagrams/91-99/Submit Report Reason use case diagram.svg"),
)
#figure(
  caption: [Submit Report Reason use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Submit Report Reason use case scenario],
    [Actors], [User],
    [Description],
    [The user must provide a written description of why the content or user is being flagged.],
    [Data], [Report reason (required text)],
    [Stimulus], [The user submits a report.],
    [Response], [The system requires a non-blank reason and includes it in the escalated report record.],
    [Comment], [Reason is mandatory on the report request.],
  ),
)
#figure(
  caption: [Submit Report Reason sequence diagram],
  image("../../../assets/Sequence diagrams/91-99/Submit Report Reason sequece diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Restrict Message Reporting use case diagram],
  image("../../../assets/Use case diagrams/91-99/Restrict Message Reporting use case diagram.svg"),
)
#figure(
  caption: [Restrict Message Reporting use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Restrict Message Reporting use case scenario],
    [Actors], [System (authorization)],
    [Description],
    [The system permits reporting a chat message only if the reporter is an active participant in that conversation.],
    [Data], [Reporter id, message id],
    [Stimulus], [A user attempts to report a message.],
    [Response],
    [The system resolves the message and verifies the reporter is a member of its conversation before accepting the report.],
    [Comment], [Enforced via the conversation membership check.],
  ),
)
#figure(
  caption: [Restrict Message Reporting sequence diagram],
  image("../../../assets/Sequence diagrams/91-99/Restrict Message Reporting sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Escalate Reports Securely use case diagram],
  image("../../../assets/Use case diagrams/91-99/Escalate Reports Securely use case diagram.svg"),
)
#figure(
  caption: [Escalate Reports Securely use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Escalate Reports Securely use case scenario],
    [Actors], [System],
    [Description],
    [The system captures the report (timestamp, reporter identity, offending content, reason) and logs it centrally for administrative review.],
    [Data], [Timestamp, reporter, target, reason],
    [Stimulus], [A valid report is submitted.],
    [Response], [The system appends a structured record to the central reports log for admins.],
    [Comment], [Reports are appended to a server-side log file (admin-reviewed).],
  ),
)
#figure(
  caption: [Escalate Reports Securely sequence diagram],
  image("../../../assets/Sequence diagrams/91-99/Escalate Reports Securely sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Navigate Across Devices use case diagram],
  image("../../../assets/Use case diagrams/91-99/Navigate Across Devices use case diagram.svg"),
)
#figure(
  caption: [Navigate Across Devices use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Navigate Across Devices use case scenario],
    [Actors], [User],
    [Description],
    [The system adapts the navigation interface to the device: a persistent side menu on desktop and an optimized bottom navigation bar on mobile.],
    [Data], [Viewport / device type],
    [Stimulus], [The user loads the app on a device.],
    [Response], [The client renders the appropriate responsive navigation shell for the viewport.],
    [Comment], [Responsive navigation is handled client-side.],
  ),
)
#figure(
  caption: [Navigate Across Devices sequence diagram],
  image("../../../assets/Sequence diagrams/91-99/Navigate Across Devices sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Display Notification Badges use case diagram],
  image("../../../assets/Use case diagrams/91-99/Display Notification Badges use case diagram.svg"),
)
#figure(
  caption: [Display Notification Badges use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Display Notification Badges use case scenario],
    [Actors], [User],
    [Description],
    [The global navigation shows a real-time badge with the user's unread notification count across all pages.],
    [Data], [Unread notification count],
    [Stimulus], [The user is anywhere in the app.],
    [Response], [The client reads the unread count and renders it as a live badge in the navigation.],
    [Comment], [Shares the unread-count source with FR89.],
  ),
)
#figure(
  caption: [Display Notification Badges sequence diagram],
  image("../../../assets/Sequence diagrams/91-99/Display Notification Badges sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Access Settings Dashboard use case diagram],
  image("../../../assets/Use case diagrams/91-99/Access Settings Dashboard use case diagram.svg"),
)
#figure(
  caption: [Access Settings Dashboard use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Access Settings Dashboard use case scenario],
    [Actors], [User],
    [Description],
    [The user navigates to a centralized settings dashboard to manage application settings and account preferences.],
    [Data], [Authenticated user (JWT principal)],
    [Stimulus], [The user opens settings.],
    [Response],
    [The client presents a settings hub aggregating profile, blocked accounts, theme, and account actions, loading each from its respective endpoint.],
    [Comment], [A client-side hub over existing profile/block/account endpoints.],
  ),
)
#figure(
  caption: [Access Settings Dashboard sequence diagram],
  image("../../../assets/Sequence diagrams/91-99/Access Settings Dashboard sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------
#figure(
  caption: [Synchronize Theme Preferences use case diagram],
  image("../../../assets/Use case diagrams/91-99/Synchronize Theme Preferences use case diagram.svg"),
)
#figure(
  caption: [Synchronize Theme Preferences use case scenario],
  table(
    columns: 2,
    table.cell(colspan: 2)[Synchronize Theme Preferences use case scenario],
    [Actors], [User],
    [Description],
    [The system saves and synchronizes the selected UI theme (Light, Dark, or System) across every device the user logs into.],
    [Data], [Theme preference],
    [Stimulus], [The user changes the theme.],
    [Response],
    [The system persists the theme on the user record; it is returned at login and on the profile, so any device applies the same theme.],
    [Comment], [Theme is stored server-side on the user and echoed at login/profile for cross-device consistency.],
  ),
)
#figure(
  caption: [Synchronize Theme Preferences sequence diagram],
  image("../../../assets/Sequence diagrams/91-99/Synchronize Theme Preferences sequence diagram.svg"),
)
#pagebreak()
// ---------------------------------------------------------------------------------





