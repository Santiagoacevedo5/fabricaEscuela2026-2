package com.ey.springboot3security.repository;

import com.ey.springboot3security.entity.UserInfo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import java.util.List;

@Repository
public interface UserInfoRepository extends JpaRepository<UserInfo, Integer> {
    Optional<UserInfo> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByDocumento(String documento);
    boolean existsByUsername(String username);
    List<UserInfo> findByRolesContaining(String roles);
}