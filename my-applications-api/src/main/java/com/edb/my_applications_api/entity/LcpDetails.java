package com.edb.my_applications_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "lcp_details")
@Getter
@Setter
public class LcpDetails {

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

  @Column(name = "titleDeedNumber")
  private String titleDeedNumber;

  @Column(name = "landAreaSqm")
  private BigDecimal landAreaSqm;

  @Column(name = "proposedLandUse")
  private String proposedLandUse;

  public LcpDetails() {
  }
}
