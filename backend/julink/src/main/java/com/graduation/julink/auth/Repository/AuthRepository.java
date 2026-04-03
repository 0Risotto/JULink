package com.graduation.julink.auth.Repository;

import com.graduation.julink.auth.AuthEntities;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuthRepository extends JpaRepository<AuthEntities.User, Long> {
    Optional<AuthEntities.User> findByUsername(String username);
    Optional<AuthEntities.User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    void deleteByEmail(String email);
    List<AuthEntities.User> findByUsernameIn(Collection<String> usernames);
}
