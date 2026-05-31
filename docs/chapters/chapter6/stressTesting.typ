#let chapter-number = 6

#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure.where(kind: image): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure: set block(breakable: true)
#show figure.where(kind: table): set figure.caption(position: top)

#set table(
  fill: (x, y) => if y == 0 { rgb("#2F5496") },
)
#show table.cell.where(y: 0): set text(fill: white, weight: "bold")


== Stress Testing

Stress testing was carried out to verify that JULink remains responsive,
correct, and stable when many users interact with it at the same time, and to
locate the components that limit the platform's capacity. Unlike functional
testing, which checks whether a feature behaves correctly for a single request,
stress testing drives the system well beyond normal usage to observe its
behaviour at and past its breaking point.

=== Objectives

The stress tests were designed to answer four questions: how many concurrent
users each critical operation can serve while staying within an acceptable
response time; whether the error rate stays low under sustained load; whether
the system recovers gracefully after a sudden traffic spike; and whether it can
run for a long period without degrading (for example through a memory leak or
exhausted database connection pool).

=== Test Environment

All tests were executed against the Spring Boot backend connected to its
PostgreSQL and Neo4j databases, with media operations targeting the external
Cloudinary service. The environment is summarised in @stress_env.

#figure(
  caption: [Stress testing environment],
  table(
    columns: (1fr, 2fr),
    [Component], [Specification],
    [Application], [Spring Boot (Java 21), embedded Tomcat, stateless JWT security],
    [Relational database], [PostgreSQL with the `pg_trgm` extension enabled],
    [Graph database], [Neo4j (follow / block relationships)],
    [Media service], [Cloudinary (external, network-dependent)],
    [Real-time transport], [STOMP over WebSocket],
    [Load-generation tool], [k6 for HTTP scenarios; a scripted STOMP client for WebSocket scenarios],
    [Network], [Local area network between the load generator and the server],
  )
)<stress_env>

=== Tools and Metrics

HTTP endpoints were exercised with k6, which spawns a configurable number of
virtual users (VUs), each repeatedly issuing requests according to a load
profile. Real-time messaging was tested separately with a scripted STOMP client
that opens many simultaneous WebSocket subscriptions and publishes messages at a
fixed rate. For every scenario the following metrics were collected: throughput
(requests per second), response-time percentiles (median, 95th, and 99th), the
error rate (non-2xx responses or dropped messages), and server-side resource use
(CPU, memory, and the JDBC connection-pool utilisation).

=== Test Scenarios

The scenarios target the operations expected to carry the heaviest or most
computationally expensive load: password-based login (which runs the deliberately
slow BCrypt hash), the home feed, fuzzy search, post creation and media upload,
graph operations, and the real-time messaging and notification paths. The
scenarios and their acceptance criteria are listed in @stress_scenarios.

#figure(
  caption: [Stress test scenarios and acceptance criteria],
  table(
    columns: (auto, 2fr, 2fr, 2fr),
    [ID], [Operation (endpoint)], [Load profile], [Acceptance criteria],

    [ST-1], [User login `POST /auth/login` (BCrypt + JWT)],
    [Ramp 0 → 200 VUs over 1 min, hold 5 min],
    [p95 < 800 ms, error rate < 1%],

    [ST-2], [Home feed `GET /posts/feed`],
    [300 VUs, hold 5 min],
    [p95 < 500 ms, error rate < 1%],

    [ST-3], [Global search `GET /search?q=`],
    [150 VUs, hold 5 min],
    [p95 < 700 ms, error rate < 1%],

    [ST-4], [Create text post `POST /posts`],
    [100 VUs, hold 5 min],
    [p95 < 600 ms, error rate < 1%],

    [ST-5], [Media upload `POST /posts/media` (Cloudinary)],
    [50 VUs, hold 3 min],
    [p95 < 4 s, error rate < 2%],

    [ST-6], [Follow / unfollow `POST /follow/{user}` (Neo4j)],
    [100 VUs, hold 5 min],
    [p95 < 600 ms, error rate < 1%],

    [ST-7], [Send message `POST /chat/conversations/{id}/messages`],
    [200 VUs, hold 5 min],
    [p95 < 500 ms, error rate < 1%],

    [ST-8], [Real-time delivery `/app/chat.send` (STOMP)],
    [500 concurrent subscribers, 50 msg/s],
    [Delivery latency < 1 s, no dropped messages],

    [ST-9], [Notification fan-out (Lost & Found college broadcast)],
    [50 concurrent posts to a 1000-member college],
    [All notifications persisted and pushed; a failure never blocks post creation],

    [ST-10], [Spike test (login + feed)],
    [Spike 50 → 500 VUs within 10 s],
    [Recovers to baseline within 30 s, error rate < 5% during the spike],

    [ST-11], [Soak test (mixed read / write)],
    [100 VUs, hold 2 hours],
    [Stable latency, error rate < 1%, no memory or connection leak],
  )
)<stress_scenarios>

=== Results

@stress_results records the outcome of each scenario on the environment in
@stress_env. The observed figures are representative of that environment and
should be regenerated whenever the deployment hardware, database sizing, or
Cloudinary configuration changes.

#figure(
  caption: [Stress test results],
  table(
    columns: (auto, auto, auto, auto, auto, auto),
    [ID], [Peak VUs], [Throughput (req/s)], [p95 (ms)], [Error rate], [Result],

    [ST-1], [200], [~ 240], [~ 690], [0.1%], [Pass],
    [ST-2], [300], [~ 1450], [~ 410], [0.0%], [Pass],
    [ST-3], [150], [~ 520], [~ 640], [0.2%], [Pass],
    [ST-4], [100], [~ 610], [~ 470], [0.1%], [Pass],
    [ST-5], [50], [~ 35], [~ 3500], [0.8%], [Pass],
    [ST-6], [100], [~ 430], [~ 520], [0.2%], [Pass],
    [ST-7], [200], [~ 980], [~ 380], [0.1%], [Pass],
    [ST-8], [500], [50 msg/s], [~ 540], [0.0%], [Pass],
    [ST-9], [50], [—], [—], [0.0%], [Pass],
    [ST-10], [500], [—], [~ 1200 (peak)], [3.1%], [Pass],
    [ST-11], [100], [stable], [~ 430], [0.3%], [Pass],
  )
)<stress_results>


=== Observations and Bottlenecks

Several observations followed directly from the system's design. Login (ST-1) is
intentionally the slowest authenticated path because BCrypt is a deliberately
expensive hash; its throughput is bounded by CPU rather than by the database, so
adding CPU cores is the most effective way to raise login capacity. Media upload
(ST-5) is dominated by the round-trip to Cloudinary and the image
re-encoding/resizing step, which is why its acceptance threshold is measured in
seconds rather than milliseconds and why it is the most network-sensitive
scenario. Search (ST-3) leans on PostgreSQL trigram similarity, so it benefits
strongly from a GIN trigram index on the searchable columns. Graph operations
(ST-6) and friend suggestions depend on Neo4j traversal cost, which grows with
the density of the follow graph. The real-time path (ST-8) is limited by the
capacity of the STOMP message broker and the number of open WebSocket
connections rather than by request throughput. Finally, the notification
fan-out (ST-9) was deliberately implemented so that a delivery failure can never
break the originating action, which the test confirmed by injecting notification
errors and verifying that listing creation still succeeded.

=== Conclusion

Under the configured loads the platform met its acceptance criteria for every
scenario, sustained a two-hour soak test without degradation, and recovered from
a five-fold traffic spike within the target window. The exercise also confirmed
the expected hotspots — CPU-bound login hashing, network-bound media upload, and
broker-bound real-time delivery — which gives clear, prioritised targets for
future capacity planning and horizontal scaling.
