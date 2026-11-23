package com.edb.my_applications_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "userId")
  private Integer userId;

  @Column(name = "firstName")
  private String firstName;

  @Column(name = "lastName")
  private String lastName;

  @Column(name = "gender")
  private String gender;

  @Column(name = "dateOfBirth")
  private LocalDate dateOfBirth;

  @Column(name = "email")
  private String email;

  @Column(name = "passwordHash")
  private String passwordHash;
}
