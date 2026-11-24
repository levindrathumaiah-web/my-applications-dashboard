package com.edb.my_applications_api.repository;

import com.edb.my_applications_api.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatusRepository extends JpaRepository<Status, Integer> {

}
