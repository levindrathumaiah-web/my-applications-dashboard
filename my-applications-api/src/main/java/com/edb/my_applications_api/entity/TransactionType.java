package com.edb.my_applications_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "transaction_types")
@Getter
@Setter
public class TransactionType {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Basic
  @Column(name = "transactionTypeId")
  private Integer transactionTypeId;

  @Column(name = "transactionType")
  private String transactionType;

  public TransactionType() {
  }
}
