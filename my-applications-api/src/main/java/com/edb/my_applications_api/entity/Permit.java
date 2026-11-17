package com.edb.my_applications_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "permits")
@Getter
@Setter
public class Permit {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Basic
  @Column(name = "permitId")
  private Integer permitId;

  @Column(name = "permitName")
  private String permitName;

  public Permit() {
  }
}
