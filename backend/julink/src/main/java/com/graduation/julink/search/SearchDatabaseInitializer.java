package com.graduation.julink.search;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class SearchDatabaseInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin (username gin_trgm_ops)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_users_first_name_trgm ON users USING gin (first_name gin_trgm_ops)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_users_last_name_trgm ON users USING gin (last_name gin_trgm_ops)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_users_college_trgm ON users USING gin (college gin_trgm_ops)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_posts_description_trgm ON posts USING gin (description gin_trgm_ops)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_hashtags_name_trgm ON hashtags USING gin (name gin_trgm_ops)");
    }
}
