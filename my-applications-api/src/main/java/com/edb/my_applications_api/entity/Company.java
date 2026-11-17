package com.edb.my_applications_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "companies")
@Getter
@Setter
public class Company {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Basic
  @Column(name = "companyId")
  private Integer companyId;

  @Column(name = "companyName")
  private String companyName;

  public Company() {
  }
}
