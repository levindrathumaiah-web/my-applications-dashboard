package com.edb.my_applications_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "fsp_details")
@Getter
@Setter
public class FspDetails {

  @Id
  @Column(name = "applicationId")
  private Integer applicationId;

  @OneToOne
  @MapsId
  @JoinColumn(name = "applicationId")
  @JsonIgnore
  private Application application;

  @Column(name = "buildingType")
  private String buildingType;

  @Column(name = "numberOfFloors")
  private Integer numberOfFloors;

  @Column(name = "alarmSystemType")
  private String alarmSystemType;

  @Column(name = "fireEngineerName")
  private String fireEngineerName;

  public FspDetails() {
  }
}
