package com.edb.my_applications_api.repository;

import com.edb.my_applications_api.entity.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicantRepository extends JpaRepository<Applicant, Integer> {
}
