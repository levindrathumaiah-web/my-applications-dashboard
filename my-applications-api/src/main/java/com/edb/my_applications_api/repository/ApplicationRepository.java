package com.edb.my_applications_api.repository;

import com.edb.my_applications_api.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ApplicationRepository
        extends JpaRepository<Application, Integer> {
  @Query("SELECT MAX(a.applicationNo) FROM Application a WHERE a.applicationNo LIKE 'APP-%'")
  String findMaxSequentialAppNo();

}
