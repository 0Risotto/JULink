= Project testing

== JUnit testing

This document catalogs the JUnit tests in the backend test suite. It was generated from the Java test sources under #raw("backend/julink/src/test/java").

=== Summary

- Test source root: #raw("backend/julink/src/test/java")
- Test classes: 28
- Test methods: 184
- Generated on: 2026-05-29

=== Package Coverage

- #raw("com.graduation.julink"): 1 classes, 1 tests
- #raw("com.graduation.julink.auth"): 2 classes, 17 tests
- #raw("com.graduation.julink.block"): 1 classes, 3 tests
- #raw("com.graduation.julink.chat"): 1 classes, 3 tests
- #raw("com.graduation.julink.chat.controller"): 2 classes, 19 tests
- #raw("com.graduation.julink.chat.service"): 3 classes, 29 tests
- #raw("com.graduation.julink.common"): 1 classes, 1 tests
- #raw("com.graduation.julink.follow"): 2 classes, 18 tests
- #raw("com.graduation.julink.lostandfound"): 2 classes, 12 tests
- #raw("com.graduation.julink.notification"): 2 classes, 10 tests
- #raw("com.graduation.julink.post"): 2 classes, 23 tests
- #raw("com.graduation.julink.profile"): 2 classes, 12 tests
- #raw("com.graduation.julink.report"): 2 classes, 7 tests
- #raw("com.graduation.julink.search"): 2 classes, 9 tests
- #raw("com.graduation.julink.token"): 1 classes, 1 tests
- #raw("com.graduation.julink.video"): 2 classes, 19 tests

=== Test Inventory

==== com.graduation.julink

===== JulinkApplicationTests

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/JulinkApplicationTests.java")
- Test count: 1

- #raw("contextLoads"): Context Loads. Source line 10.

==== com.graduation.julink.auth

===== AuthControllerTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/auth/AuthControllerTest.java")
- Test count: 7

- #raw("register_Success"): Register: Success. Source line 55.
- #raw("register_IllegalArgumentException"): Register: Illegal Argument Exception. Source line 66.
- #raw("sendOTP_Success"): Send OTP: Success. Source line 77.
- #raw("verifyOTP_Success"): Verify OTP: Success. Source line 88.
- #raw("login_Success"): Login: Success. Source line 99.
- #raw("healthCheck_Success"): Health Check: Success. Source line 121.
- #raw("kill_Success"): Kill: Success. Source line 129.

===== AuthServiceImplementationTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/auth/AuthServiceImplementationTest.java")
- Test count: 10

- #raw("createUser_Success"): Create User: Success. Source line 93.
- #raw("createUser_InvalidEmailFormat"): Create User: Invalid Email Format. Source line 105.
- #raw("sendOTP_Success"): Send OTP: Success. Source line 116.
- #raw("verifyOTP_Success"): Verify OTP: Success. Source line 129.
- #raw("verifyOTP_InvalidOTP"): Verify OTP: Invalid OTP. Source line 138.
- #raw("verifyOTP_ExpiredOTP"): Verify OTP: Expired OTP. Source line 147.
- #raw("loginUser_Success"): Login User: Success. Source line 158.
- #raw("loginUser_WithUsername_Success"): Login User: With Username: Success. Source line 170.
- #raw("loginUser_InvalidPassword"): Login User: Invalid Password. Source line 183.
- #raw("kill_Success"): Kill: Success. Source line 194.

==== com.graduation.julink.block

===== BlockServiceTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/block/BlockServiceTest.java")
- Test count: 3

- #raw("block_CreatesPostgresRecordNeo4jMirrorAndRemovesFollows"): Block: Creates Postgres Record Neo4j Mirror And Removes Follows. Source line 44.
- #raw("block_RejectsSelfBlock"): Block: Rejects Self Block. Source line 61.
- #raw("unblock_RemovesPostgresRecordAndNeo4jMirror"): Unblock: Removes Postgres Record And Neo4j Mirror. Source line 74.

==== com.graduation.julink.chat

===== ChatMapperTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/chat/ChatMapperTest.java")
- Test count: 3

- #raw("toMessageResponse_PostShareIncludesSharedPostId"): To Message Response: Post Share Includes Shared Post Id. Source line 25.
- #raw("toMessageResponse_DeletedPostShareHidesSharedPostId"): To Message Response: Deleted Post Share Hides Shared Post Id. Source line 37.
- #raw("toConversationResponse_MembersIncludeAdminState"): To Conversation Response: Members Include Admin State. Source line 50.

==== com.graduation.julink.chat.controller

===== ChatControllerTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/chat/controller/ChatControllerTest.java")
- Test count: 16

- #raw("listConversations_Success"): List Conversations: Success. Source line 67.
- #raw("createOrGetDM_Success"): Create Or Get DM: Success. Source line 79.
- #raw("createGroup_Success"): Create Group: Success. Source line 92.
- #raw("addMembers_Success"): Add Members: Success. Source line 105.
- #raw("updateGroup_Success"): Update Group: Success. Source line 118.
- #raw("removeMember_Success"): Remove Member: Success. Source line 132.
- #raw("leaveGroup_Success"): Leave Group: Success. Source line 144.
- #raw("updateMemberAdmin_Success"): Update Member Admin: Success. Source line 156.
- #raw("startGroupCall_Success"): Start Group Call: Success. Source line 170.
- #raw("getMessages_Success"): Get Messages: Success. Source line 189.
- #raw("sendMessage_Success"): Send Message: Success. Source line 202.
- #raw("sendMediaMessage_Success"): Send Media Message: Success. Source line 215.
- #raw("sharePost_Success"): Share Post: Success. Source line 227.
- #raw("editMessage_Success"): Edit Message: Success. Source line 243.
- #raw("deleteMessage_Success"): Delete Message: Success. Source line 256.
- #raw("markRead_Success"): Mark Read: Success. Source line 267.

===== ChatWebSocketControllerTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/chat/controller/ChatWebSocketControllerTest.java")
- Test count: 3

- #raw("sendMessage_Success"): Send Message: Success. Source line 23.
- #raw("typing_Success"): Typing: Success. Source line 36.
- #raw("markRead_Success"): Mark Read: Success. Source line 50.

==== com.graduation.julink.chat.service

===== ChatServiceTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/chat/service/ChatServiceTest.java")
- Test count: 21

- #raw("getOrCreateDM_ExistingDM"): Get Or Create DM: Existing DM. Source line 106.
- #raw("getOrCreateDM_NewDM"): Get Or Create DM: New DM. Source line 125.
- #raw("createGroup_CreatorIsAdmin"): Create Group: Creator Is Admin. Source line 144.
- #raw("updateGroup_AdminCanRenameAndChangeImage"): Update Group: Admin Can Rename And Change Image. Source line 165.
- #raw("updateGroup_NonAdminRejected"): Update Group: Non Admin Rejected. Source line 185.
- #raw("removeMember_AdminCanRemoveMember"): Remove Member: Admin Can Remove Member. Source line 198.
- #raw("removeMember_AdminCannotRemoveSelf"): Remove Member: Admin Cannot Remove Self. Source line 216.
- #raw("leaveGroup_LastAdminRejected"): Leave Group: Last Admin Rejected. Source line 229.
- #raw("leaveGroup_NonAdminCanLeave"): Leave Group: Non Admin Can Leave. Source line 240.
- #raw("updateMemberAdmin_AdminCanPromoteMember"): Update Member Admin: Admin Can Promote Member. Source line 257.
- #raw("updateMemberAdmin_LastAdminCannotBeDemoted"): Update Member Admin: Last Admin Cannot Be Demoted. Source line 277.
- #raw("startGroupCall_BroadcastsToAllMembersExceptCaller"): Start Group Call: Broadcasts To All Members Except Caller. Source line 290.
- #raw("groupOnlyOperation_RejectsDm"): Group Only Operation: Rejects Dm. Source line 322.
- #raw("createGroup_Success"): Create Group: Success. Source line 333.
- #raw("sendMessage_Success"): Send Message: Success. Source line 352.
- #raw("sharePost_Success"): Share Post: Success. Source line 372.
- #raw("sharePost_PostNotFound_DoesNotPersistOrBroadcast"): Share Post: Post Not Found: Does Not Persist Or Broadcast. Source line 403.
- #raw("sharePost_NonMember_DoesNotLookupPostOrPersist"): Share Post: Non Member: Does Not Lookup Post Or Persist. Source line 420.
- #raw("sharePost_FriendshipRejected_DoesNotLookupPostOrPersist"): Share Post: Friendship Rejected: Does Not Lookup Post Or Persist. Source line 435.
- #raw("getMessages_Success"): Get Messages: Success. Source line 452.
- #raw("markRead_Success"): Mark Read: Success. Source line 470.

===== FileStorageServiceTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/chat/service/FileStorageServiceTest.java")
- Test count: 4

- #raw("store_ImageSuccess"): Store: Image Success. Source line 31.
- #raw("store_VideoSuccess"): Store: Video Success. Source line 49.
- #raw("store_AudioSuccess"): Store: Audio Success. Source line 62.
- #raw("store_FileSuccess"): Store: File Success. Source line 76.

===== FriendshipValidatorTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/chat/service/FriendshipValidatorTest.java")
- Test count: 4

- #raw("areFriends_ReturnsTrue"): Are Friends: Returns True. Source line 27.
- #raw("areFriends_ReturnsFalse"): Are Friends: Returns False. Source line 33.
- #raw("assertFriends_Success"): Assert Friends: Success. Source line 39.
- #raw("assertFriends_ThrowsException"): Assert Friends: Throws Exception. Source line 45.

==== com.graduation.julink.common

===== TokenServiceTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/common/TokenServiceTest.java")
- Test count: 1

- #raw("generateToken_Success"): Generate Token: Success. Source line 45.

==== com.graduation.julink.follow

===== FollowControllerTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/follow/FollowControllerTest.java")
- Test count: 8

- #raw("followUser_Success"): Follow User: Success. Source line 63.
- #raw("unfollowUser_Success"): Unfollow User: Success. Source line 74.
- #raw("getFollowers_Success"): Get Followers: Success. Source line 85.
- #raw("getFollowings_Success"): Get Followings: Success. Source line 95.
- #raw("isFollowing_Success"): Is Following: Success. Source line 105.
- #raw("isMutual_Success"): Is Mutual: Success. Source line 116.
- #raw("getSuggestions_Success"): Get Suggestions: Success. Source line 127.
- #raw("postSuggestionsRouteDoesNotFollowSuggestionUser"): Post Suggestions Route Does Not Follow Suggestion User. Source line 137.

===== FollowServiceTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/follow/FollowServiceTest.java")
- Test count: 10

- #raw("followUser_Success"): Follow User: Success. Source line 52.
- #raw("followUser_ThrowsExceptionWhenSameUser"): Follow User: Throws Exception When Same User. Source line 63.
- #raw("unfollowUser_Success"): Unfollow User: Success. Source line 72.
- #raw("getFollowers_Success"): Get Followers: Success. Source line 81.
- #raw("isFollowing_ReturnsTrue"): Is Following: Returns True. Source line 100.
- #raw("isMutual_ReturnsTrue"): Is Mutual: Returns True. Source line 106.
- #raw("getSuggestions_UsesRecentPostOwnersAndDoesNotUseJaccard"): Get Suggestions: Uses Recent Post Owners And Does Not Use Jaccard. Source line 112.
- #raw("getSuggestions_ExcludesCurrentFollowedAndBlockedUsers"): Get Suggestions: Excludes Current Followed And Blocked Users. Source line 137.
- #raw("getSuggestions_SeenPostsArePenalizedButStillEligible"): Get Suggestions: Seen Posts Are Penalized But Still Eligible. Source line 161.
- #raw("getSuggestions_ReturnsFewerThanLimitWhenPoolIsSmall"): Get Suggestions: Returns Fewer Than Limit When Pool Is Small. Source line 179.

==== com.graduation.julink.lostandfound

===== LostAndFoundControllerTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/lostandfound/LostAndFoundControllerTest.java")
- Test count: 4

- #raw("createLostAndFound_Success"): Create Lost And Found: Success. Source line 58.
- #raw("markLostAndFoundAsResolved_Success"): Mark Lost And Found As Resolved: Success. Source line 72.
- #raw("getAllLostAndFounds_Success"): Get All Lost And Founds: Success. Source line 86.
- #raw("claimLostAndFound_Success"): Claim Lost And Found: Success. Source line 97.

===== LostAndFoundServiceTest

- Source: #raw("backend/julink/src/test/java/com/graduation/julink/lostandfound/LostAndFoundServiceTest.java")
- Test count: 8

- #raw("addLostAndFound_Success"): Add Lost And Found: Success. Source line 59.
- #raw("markAsResolved_Success"): Mark

#pagebreak()