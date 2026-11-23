package com.edb.my_applications_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "blup_details")
@Getter
@Setter
public class BlupDetails {

  @Id
  @Column(name = "applicationId")
  private Integer applicationId;

  @OneToOne
  @MapsId
  @JoinColumn(name = "applicationId")
  @JsonIgnore
  private Application application;

  @Column(name = "siteAddress")
  private String siteAddress;

  @Column(name = "localAuthority")
  private String localAuthority;

  @Column(name = "developmentCategory")
  private String developmentCategory;

  @Column(name = "natureOfWorks")
  private String natureOfWorks;

  @Column(name = "floorAreaSqm")
  private BigDecimal floorAreaSqm;

  @Column(name = "numberOfFloors")
  private Integer numberOfFloors;

  public BlupDetails() {
  }
}
