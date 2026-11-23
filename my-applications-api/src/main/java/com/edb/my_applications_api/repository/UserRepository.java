package com.edb.my_applications_api.repository;

import com.edb.my_applications_api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);
}
