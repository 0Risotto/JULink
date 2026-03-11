package com.graduation.julink.auth.Repository;

import com.graduation.julink.auth.AuthEntities;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OTPRepository extends JpaRepository<AuthEntities.OTP, Long> {
    boolean existsByEmail(String email);
    void deleteByEmailIgnoreCase(String email);
    Optional<AuthEntities.OTP> findByEmail(String email);
}
