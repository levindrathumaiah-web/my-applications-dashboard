package com.edb.my_applications_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "fire_details")
@Getter
@Setter
public class FireDetails {

  @Id
  @Column(name = "applicationId")
  private Integer applicationId;

  @OneToOne
  @MapsId
  @JoinColumn(name = "applicationId")
  @JsonIgnore
  private Application application;

  @Column(name = "premisesAddress")
  private String premisesAddress;

  @Column(name = "occupancyLoad")
  private Integer occupancyLoad;

  @Column(name = "extinguisherCount")
  private Integer extinguisherCount;

  @Column(name = "emergencyExits")
  private Integer emergencyExits;

  @Column(name = "hasSprinklerSystem")
  private Boolean hasSprinklerSystem;

  @Column(name = "lastInspectionDate")
  private LocalDate lastInspectionDate;

  public FireDetails() {
  }
}
