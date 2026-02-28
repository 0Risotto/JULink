= Project testing
== Test cases
=== Unit testing

#set table(
  fill: (coloum, row) => if coloum == 0 { rgb("#2F5496") },
  stroke: rgb("#2F5496"),
  align: center + horizon,
)
#show table.cell.where(x: 0): set text(fill: white, weight: "bold")

#show table.cell.where(x: 1): set text(fill: black, weight: "regular")

#show figure.where(
  kind: table,
): set figure.caption(position: top)

#counter(figure.where(kind: table)).update(0)
#let chapter-number = 6
#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)

#figure(
  caption: [USR-SIGNUP-01 test case],
  table(
    columns: 2,
    [Test case ID], [USR-SIGNUP-01],

    [Description], [Create user successfully when username & email are free and email is JU domain],

    [Precondition],
    [Application running; UserRepo, UserMapper and other dependencies mocked; no user exists with username newuser or email newuser#text("@ju.edu.jo").],

    [Test steps],
    [
      1) Build CreateUserRequestDTO("newuser","newuser#text("@ju.edu.jo")", firstName, lastName, college, "password123").

      2) Stub userRepo.existsByUsername("newuser") → false.

      3) Stub userRepo.existsByEmail("newuser#text("@ju.edu.jo")") → false.

      4) Stub userMapper.toEntity(dto) to return a User entity.

      5) Call userService.createUser(dto).],

    [Expected result],
    [

      1) No exception is thrown.

      2) userRepo.existsByUsername("newuser") and userRepo.existsByEmail("newuser#text("@ju.edu.jo")") are called once.

      3) userMapper.toEntity(dto) is called.

      4) userRepo.save(user) is called with the mapped entity.],
  ),
)
#figure(
  caption: [USR-SIGNUP-02 test case],
  table(
    columns: 2,

    [Test case ID], [USR-SIGNUP-02],

    [Description], [Reject registration when email is not from #text("@ju.edu.jo") domain],

    [Precondition], [Application running; dependencies mocked.],

    [Test steps],
    [
      1) Build CreateUserRequestDTO("newuser","newuser#text("@gmail.com")", ...).

      2) Call userService.createUser(dto).],

    [Expected result],
    [1) IllegalArgumentException is thrown.

      2) Exception message: "Email must end with #text("@ju.edu.jo")".

      3) No repository, mapper, or mail sender interactions occur.],
  ),
)
#figure(
  caption: [USR-SIGNUP-03 test case],
  table(
    columns: 2,
    [Test case ID], [USR-SIGNUP-03],

    [Description], [Reject registration when username is already taken],

    [Precondition], [UserRepo mocked to report username exists.],

    [Test steps],
    [
      1) Build CreateUserRequestDTO("existinguser","existinguser#text("@ju.edu.jo")", ...).

      2) Stub userRepo.existsByUsername("existinguser") → true.

      3) Call userService.createUser(dto).],

    [Expected result],
    [
      1) IllegalArgumentException is thrown.

      2) Message: "Username already exists".

      3) userRepo.existsByUsername("existinguser") is called.

      4) userRepo.existsByEmail(...) and userMapper.toEntity(...) are not called; user is not saved.],
  ),
)
#figure(
  caption: [USR-SIGNUP-04 test case],
  table(
    columns: 2,
    [Test case ID], [USR-SIGNUP-04],

    [Description], [Reject registration when email is already used],

    [Precondition], [Username is free; UserRepo mocked to report email exists.],

    [Test steps],
    [
      1) Build CreateUserRequestDTO("newuser","existing#text("@ju.edu.jo")", ...).

      2) Stub userRepo.existsByUsername("newuser") → false.

      3) Stub userRepo.existsByEmail("existing#text("@ju.edu.jo")") → true.

      4) Call userService.createUser(dto).],

    [Expected result],
    [
      1) IllegalArgumentException is thrown.

      2) Message: "Email already exists".

      3) existsByUsername and existsByEmail are called.

      4) userMapper.toEntity and userRepo.save are never called.],
  ),
)
#figure(
  caption: [USR-LOGIN-01 test case],
  table(
    columns: 2,
    [Test case ID], [USR-LOGIN-01],

    [Description], [Fail login when user does not exist],

    [Precondition], [No user stored with given email.],

    [Test steps],
    [
      1) Build LoginUserDTO("user#text("@ju.edu.jo")","secret123").

      2) Stub userRepo.findByEmail("user#text("@ju.edu.jo")") → Optional.of(user) with passwordHash="hashed".

      3) Stub passwordEncoder.matches("secret123","hashed") → true.

      4) Call userService.loginUser(dto).],

    [Expected result],
    [
      1) No exception thrown.

      2) userRepo.findByEmail(...) called with lowercased trimmed email.

      3) passwordEncoder.matches called with provided password and stored hash.],
  ),
)
#figure(
  caption: [USR-LOGIN-02 test case],
  table(
    columns: 2,
    [Test case ID], [USR-LOGIN-02],

    [Description], [Successful login when user exists and password matches],

    [Precondition], [UserRepo and PasswordEncoder mocked; stored user with hashed password exists.],

    [Test steps],
    [
      1) Build LoginUserDTO("missing#text("@ju.edu.jo")","any").

      2) Stub userRepo.findByEmail("missing#text("@ju.edu.jo")") → Optional.empty().

      3) Call userService.loginUser(dto).],

    [Expected result],
    [
      1) RuntimeException is thrown with message "User not found".

      2) passwordEncoder is never called.],
  ),
)
#figure(
  caption: [USR-LOGIN-03 test case],
  table(
    columns: 2,
    [Test case ID], [USR-LOGIN-03],

    [Description], [Fail login when password is incorrect],

    [Precondition], [User exists with some password hash.],

    [Test steps],
    [
      1) Build LoginUserDTO("user#text("@ju.edu.jo")","wrong").

      2) Stub userRepo.findByEmail("user#text("@ju.edu.jo")") → Optional.of(user) with passwordHash="hashed".

      3) Stub passwordEncoder.matches("wrong","hashed") → false.

      4) Call userService.loginUser(dto).],

    [Expected result],
    [
      1) RuntimeException is thrown with message "Invalid password".

      2) userRepo.findByEmail and passwordEncoder.matches are called once.],
  ),
)
#figure(
  caption: [OTP-SEND-01 test case],
  table(
    columns: 2,
    [Test case ID], [OTP-SEND-01],

    [Description], [When no OTP exists for email, save new OTP and send email],

    [Precondition], [OTPRepo, UserMapper, and JavaMailSender mocked; otpRepo.existsByEmail returns false.],

    [Test steps],
    [
      1) Use email "user#text("@ju.edu.jo")".

      2) Stub otpRepo.existsByEmail("user#text("@ju.edu.jo")") → false.

      3) Stub userMapper.toOTP(any()) → new empty OTP instance.

      4) Call userService.sendOTP("user#text("@ju.edu.jo")").],

    [Expected result],
    [
      1) No exception thrown.

      2) otpRepo.existsByEmail called once.

      3) otpRepo.deleteByEmailIgnoreCase is not called.

      4) otpRepo.save(otp) is called with an OTP whose email equals input email, and with non-null otp value and expiresAt ~ now + 3 minutes.

      5) javaMailSender.send(SimpleMailMessage) is invoked once.],
  ),
)
#figure(
  caption: [OTP-SEND-02 test case],
  table(
    columns: 2,
    [Test case ID], [OTP-SEND-02],

    [Description], [When an OTP already exists, delete old record and save new one],

    [Precondition], [otpRepo.existsByEmail returns true.],

    [Test steps],
    [1) Use same email "user#text("@ju.edu.jo")".

      2) Stub otpRepo.existsByEmail(...) → true.

      3) Stub userMapper.toOTP(any()) → new OTP.

      4) Call userService.sendOTP(email).],

    [Expected result],
    [
      1) No exception thrown.

      2) otpRepo.existsByEmail(email) is called.

      3) otpRepo.deleteByEmailIgnoreCase(email) is invoked before saving.

      4) otpRepo.save(any(OTP)) is called.

      5) javaMailSender.send(SimpleMailMessage) called once.],
  ),
)
#figure(
  caption: [OTP-VER-01 test case],
  table(
    columns: 2,
    [Test case ID], [OTP-VER-01],

    [Description], [OTP is valid and not expired → verification succeeds],

    [Precondition], [User and OTP records exist, OTP matches, expiry in future.],

    [Test steps],
    [
      1) Prepare user with email="user#text("@ju.edu.jo")".

      2) Prepare OTP with same email, otp="123456", expiresAt = now + 5 minutes.

      3) Stub userRepo.findByEmail(email) → Optional.of(user).

      4) Stub otpRepo.findByEmail(email) → Optional.of(otp).

      5) Call userService.verifyOTP("123456", email).],

    [Expected result],
    [
      1) No exception thrown.

      2) "Valid OTP" message printed (optional).

      3) userRepo.deleteByEmail is not called.],
  ),
)
#figure(
  caption: [OTP-VER-02 test case],
  table(
    columns: 2,
    [Test case ID], [OTP-VER-02],

    [Description], [OTP matches but is expired → user is deleted],

    [Precondition], [User and OTP present, but expiresAt < now.],

    [Test steps],
    [
      1) Prepare user and OTP as above, but expiresAt = now − 1 minute.

      2) Stub userRepo.findByEmail(email) and otpRepo.findByEmail(email) to return these instances.

      3) Call userService.verifyOTP("123456", email).],

    [Expected result],
    [
      1) No exception thrown.

      2) After call, userRepo.deleteByEmail(email) is invoked exactly once.],
  ),
)
#figure(
  caption: [OTP-VER-03 test case],
  table(
    columns: 2,
    [Test case ID], [OTP-VER-03],

    [Description], [OTP does not match → exception thrown],

    [Precondition], [User and OTP exist, but stored OTP value differs.],

    [Test steps],
    [1) Prepare user.

      2) Prepare OTP with otp="654321" and not expired.

      3) Stub userRepo.findByEmail(email) → Optional.of(user).

      4) Stub otpRepo.findByEmail(email) → Optional.of(otp).

      5) Call userService.verifyOTP("123456", email).],

    [Expected result],
    [
      1) RuntimeException is thrown with message "Invalid OTP, the given otp is incorrect".

      2) userRepo.deleteByEmail is not called.],
  ),
)
#figure(
  caption: [OTP-VER-04 test case],
  table(
    columns: 2,
    [Test case ID], [OTP-VER-04],

    [Description], [No user/OTP found for email → exception thrown],

    [Precondition], [userRepo.findByEmail(email) returns Optional.empty().],

    [Test steps],
    [1) Use email "user#text("@ju.edu.jo")" and otp "123456".

      2) Stub userRepo.findByEmail(email) → Optional.empty().

      3) Call userService.verifyOTP("123456", email).],

    [Expected result],
    [
      1) RuntimeException is thrown with message "No OTP found for this email" (from userRepo lookup).

      2) otpRepo is never called.],
  ),
)
#figure(
  caption: [CTRL-ENTRY-01 test case],
  table(
    columns: 2,
    [Test case ID], [CTRL-ENTRY-01],

    [Description], [POST /entry/createUser calls service and returns "success"],

    [Precondition], [UserController created with mocked UserService.],

    [Test steps],
    [1) Build valid CreateUserRequestDTO.

      2) Call userController.createUser(dto).],

    [Expected result],
    [
      1) userService.createUser(dto) is called exactly once.

      2) Method returns string "success".],
  ),
)
#figure(
  caption: [CTRL-ENTRY-02 test case],
  table(
    columns: 2,
    [Test case ID], [CTRL-ENTRY-02],

    [Description], [POST /entry/sendOTP calls service and returns "success"],

    [Precondition], [UserService mocked.],

    [Test steps],
    [
      1) Build SendOTPDTO("user#text("@ju.edu.jo")").

      2) Call userController.sendOTP(dto).],

    [Expected result],
    [
      1) userService.sendOTP("user#text("@ju.edu.jo")") called once.

      2) Return value equals "success".],
  ),
)
#figure(
  caption: [CTRL-ENTRY-03 test case],
  table(
    columns: 2,
    [Test case ID], [CTRL-ENTRY-03],

    [Description], [POST /entry/checkOTPValidity calls service and returns "success"],

    [Precondition], [UserService mocked.],

    [Test steps],
    [
      1) Build OTPDTO("123456","user#text("@ju.edu.jo")").

      2) Call userController.checkOTPValidity(dto).],

    [Expected result],
    [
      1) userService.verifyOTP("123456","user#text("@ju.edu.jo")") called once.

      2) Return value "success".],
  ),
)
#figure(
  caption: [CTRL-ENTRY-04 test case],
  table(
    columns: 2,
    [Test case ID], [CTRL-ENTRY-03],

    [Description], [POST /entry/loginUser calls service and returns "success"],

    [Precondition], [UserService mocked.],

    [Test steps],
    [
      1) Build LoginUserDTO("user#text("@ju.edu.jo")","secret123").

      2) Call userController.loginUser(dto).],

    [Expected result],
    [
      1) userService.loginUser(dto) invoked once.

      2) String "success" returned.],
  ),
)
