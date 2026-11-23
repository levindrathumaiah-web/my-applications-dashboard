package com.edb.my_applications_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "applicants")
@Getter
@Setter
public class Applicant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Basic
  @Column(name = "applicantId")
  private Integer applicantId;

  @Column(name = "applicantName")
  private String applicantName;

  @ManyToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
  @JoinColumn(name = "companyId")
  private Company company;

  @ManyToOne
  @JoinColumn(name = "userId")
  private User user;

  public Applicant() {
  }
}



