package com.example.JuLink.reposotiry;

import com.example.JuLink.entity.OTP;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OTPRepo extends JpaRepository<OTP,Long> {
    boolean existsByEmail(String email);
    void deleteByEmailIgnoreCase(String email);
    Optional<OTP> findByEmail(String email);

}
