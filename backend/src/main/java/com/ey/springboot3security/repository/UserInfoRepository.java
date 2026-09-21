package com.ey.springboot3security.repository;

import com.ey.springboot3security.entity.UserInfo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserInfoRepository extends JpaRepository<UserInfo, Integer> {
    Optional<UserInfo> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByDocumento(String documento);
    boolean existsByUsername(String username);
}