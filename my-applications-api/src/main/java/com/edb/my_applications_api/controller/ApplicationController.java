package com.edb.my_applications_api.controller;

import com.edb.my_applications_api.entity.*;
import com.edb.my_applications_api.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/applications")
@CrossOrigin(origins = "http://localhost:4200")
public class ApplicationController {

  private final ApplicationRepository applicationRepository;
  private final PermitRepository permitRepository;
  private final TransactionTypeRepository transactionTypeRepository;
  private final ApplicantRepository applicantRepository;
  private final StatusRepository statusRepository;
  private final UserRepository userRepository;

  public ApplicationController(
    ApplicationRepository applicationRepository,
    PermitRepository permitRepository,
    TransactionTypeRepository transactionTypeRepository,
    ApplicantRepository applicantRepository,
    StatusRepository statusRepository,
    UserRepository userRepository) {
    this.applicationRepository = applicationRepository;
    this.permitRepository = permitRepository;
    this.transactionTypeRepository = transactionTypeRepository;
    this.applicantRepository = applicantRepository;
    this.statusRepository = statusRepository;
    this.userRepository = userRepository;
  }

  @GetMapping
  public List<Application> getAllApplications() {
    return applicationRepository.findAll();
  }

  @GetMapping("/permits")
  public List<Permit> getAllPermits() {
    return permitRepository.findAll();
  }

  @GetMapping("/transaction-types")
  public List<TransactionType> getAllTransactionTypes() {
    return transactionTypeRepository.findAll();
  }

  @GetMapping("/applicants/user/{userId}")
  public List<Applicant> getApplicantsByUser(@PathVariable Integer userId) {
    return applicantRepository.findAll().stream()
      .filter(a -> a.getUser() != null && userId.equals(a.getUser().getUserId()))
      .toList();
  }

  @PostMapping
  public ResponseEntity<Application> createApplication(@RequestBody Application payload) {
    Application app = new Application();
    app.setCreatedDate(LocalDate.now());
    app.setApplicationNo(generateApplicationNo());
    populateApplicationFields(app, payload);
    return ResponseEntity.ok(applicationRepository.save(app));
  }

  @PutMapping("/{id}")
  public ResponseEntity<Application> updateApplication(
    @PathVariable Integer id,
    @RequestBody Application payload) {
    return applicationRepository.findById(id)
      .map(existing -> {
        populateApplicationFields(existing, payload);
        return ResponseEntity.ok(applicationRepository.save(existing));
      })
      .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteApplication(@PathVariable Integer id) {
    if (!applicationRepository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    applicationRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  private void populateApplicationFields(Application target, Application source) {
    if (source.getApplicant() != null) {
      Applicant incoming = source.getApplicant();
      Applicant resolved;

      if (incoming.getApplicantId() != null) {
        resolved = applicantRepository.findById(incoming.getApplicantId())
          .orElseGet(Applicant::new);
      } else {
        resolved = new Applicant();
      }

      if (incoming.getApplicantName() != null && !incoming.getApplicantName().isBlank()) {
        resolved.setApplicantName(incoming.getApplicantName().trim());
      }

      if (incoming.getUser() != null && incoming.getUser().getUserId() != null) {
        userRepository.findById(incoming.getUser().getUserId())
          .ifPresent(resolved::setUser);
      }

      if (incoming.getCompany() != null &&
        incoming.getCompany().getCompanyName() != null &&
        !incoming.getCompany().getCompanyName().isBlank()) {
        Company company = resolved.getCompany() != null ? resolved.getCompany() : new Company();
        company.setCompanyName(incoming.getCompany().getCompanyName().trim());
        company.setBrn(incoming.getCompany().getBrn() != null ? incoming.getCompany().getBrn().trim() : null);
        resolved.setCompany(company);
      } else if (incoming.getApplicantId() == null) {
        resolved.setCompany(null);
      }

      target.setApplicant(applicantRepository.save(resolved));
    }

    if (source.getPermit() != null && source.getPermit().getPermitId() != null) {
      permitRepository.findById(source.getPermit().getPermitId())
        .ifPresent(target::setPermit);
    }

    if (source.getTransactionType() != null && source.getTransactionType().getTransactionTypeId() != null) {
      transactionTypeRepository.findById(source.getTransactionType().getTransactionTypeId())
        .ifPresent(target::setTransactionType);
    }

    String requestedStatus = (source.getStatus() != null && source.getStatus().getStatusName() != null)
      ? source.getStatus().getStatusName()
      : "Draft";

    statusRepository.findAll().stream()
      .filter(s -> s.getStatusName().equalsIgnoreCase(requestedStatus))
      .findFirst()
      .ifPresent(target::setStatus);

    if ("Submitted".equalsIgnoreCase(requestedStatus) && target.getSubmittedDate() == null) {
      target.setSubmittedDate(LocalDate.now());
    }

    if (source.getLcpDetails() != null) {
      LcpDetails d = target.getLcpDetails() != null ? target.getLcpDetails() : new LcpDetails();
      d.setApplication(target);
      d.setSiteAddress(source.getLcpDetails().getSiteAddress());
      d.setTitleDeedNumber(source.getLcpDetails().getTitleDeedNumber());
      d.setLandAreaSqm(source.getLcpDetails().getLandAreaSqm());
      d.setProposedLandUse(source.getLcpDetails().getProposedLandUse());
      target.setLcpDetails(d);
    }

    if (source.getBlupDetails() != null) {
      BlupDetails d = target.getBlupDetails() != null ? target.getBlupDetails() : new BlupDetails();
      d.setApplication(target);
      d.setSiteAddress(source.getBlupDetails().getSiteAddress());
      d.setLocalAuthority(source.getBlupDetails().getLocalAuthority());
      d.setDevelopmentCategory(source.getBlupDetails().getDevelopmentCategory());
      d.setNatureOfWorks(source.getBlupDetails().getNatureOfWorks());
      d.setFloorAreaSqm(source.getBlupDetails().getFloorAreaSqm());
      d.setNumberOfFloors(source.getBlupDetails().getNumberOfFloors());
      target.setBlupDetails(d);
    }

    if (source.getFspDetails() != null) {
      FspDetails d = target.getFspDetails() != null ? target.getFspDetails() : new FspDetails();
      d.setApplication(target);
      d.setBuildingType(source.getFspDetails().getBuildingType());
      d.setNumberOfFloors(source.getFspDetails().getNumberOfFloors());
      d.setAlarmSystemType(source.getFspDetails().getAlarmSystemType());
      d.setFireEngineerName(source.getFspDetails().getFireEngineerName());
      target.setFspDetails(d);
    }

    if (source.getFireDetails() != null) {
      FireDetails d = target.getFireDetails() != null ? target.getFireDetails() : new FireDetails();
      d.setApplication(target);
      d.setPremisesAddress(source.getFireDetails().getPremisesAddress());
      d.setOccupancyLoad(source.getFireDetails().getOccupancyLoad());
      d.setExtinguisherCount(source.getFireDetails().getExtinguisherCount());
      d.setEmergencyExits(source.getFireDetails().getEmergencyExits());
      d.setHasSprinklerSystem(source.getFireDetails().getHasSprinklerSystem());
      d.setLastInspectionDate(source.getFireDetails().getLastInspectionDate());
      target.setFireDetails(d);
    }

    if (source.getOccupationDetails() != null) {
      OccupationDetails d = target.getOccupationDetails() != null ? target.getOccupationDetails() : new OccupationDetails();
      d.setApplication(target);
      d.setBlupReferenceNumber(source.getOccupationDetails().getBlupReferenceNumber());
      d.setCompletionDate(source.getOccupationDetails().getCompletionDate());
      d.setCertifiedArchitectName(source.getOccupationDetails().getCertifiedArchitectName());
      d.setIntendedOccupancyType(source.getOccupationDetails().getIntendedOccupancyType());
      target.setOccupationDetails(d);
    }
  }

  private String generateApplicationNo() {
    String suffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    return "EDB-" + Year.now().getValue() + "-" + suffix;
  }
}
