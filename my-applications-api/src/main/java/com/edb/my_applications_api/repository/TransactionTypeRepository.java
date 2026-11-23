package com.edb.my_applications_api.repository;

import com.edb.my_applications_api.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionTypeRepository extends JpaRepository<TransactionType, Integer> {
}
