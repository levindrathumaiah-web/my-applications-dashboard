package com.edb.my_applications_api.repository;

import com.edb.my_applications_api.entity.Permit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermitRepository extends JpaRepository<Permit, Integer> {
}
