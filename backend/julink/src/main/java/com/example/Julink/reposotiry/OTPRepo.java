package com.example.Julink.reposotiry;

import com.example.Julink.entity.OTP;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OTPRepo extends JpaRepository<OTP,Long> {
    boolean existsByEmail(String email);
    void deleteByEmailIgnoreCase(String email);
    Optional<OTP> findByEmail(String email);

}
