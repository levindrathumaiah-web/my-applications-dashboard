package com.edb.my_applications_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "occupation_details")
@Getter
@Setter
public class OccupationDetails {

  @Id
  @Column(name = "applicationId")
  private Integer applicationId;

  @OneToOne
  @MapsId
  @JoinColumn(name = "applicationId")
  @JsonIgnore
  private Application application;

  @Column(name = "blupReferenceNumber")
  private String blupReferenceNumber;

  @Column(name = "completionDate")
  private LocalDate completionDate;

  @Column(name = "certifiedArchitectName")
  private String certifiedArchitectName;

  @Column(name = "intendedOccupancyType")
  private String intendedOccupancyType;

  public OccupationDetails() {
  }
}
