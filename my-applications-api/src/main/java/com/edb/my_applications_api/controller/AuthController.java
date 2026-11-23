package com.edb.my_applications_api.controller;

import com.edb.my_applications_api.entity.Applicant;
import com.edb.my_applications_api.entity.User;
import com.edb.my_applications_api.repository.ApplicantRepository;
import com.edb.my_applications_api.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

  private final UserRepository userRepository;
  private final ApplicantRepository applicantRepository;

  public AuthController(UserRepository userRepository, ApplicantRepository applicantRepository) {
    this.userRepository = userRepository;
    this.applicantRepository = applicantRepository;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
    String email = credentials.get("email") != null ? credentials.get("email").trim() : "";
    String password = credentials.get("password") != null ? credentials.get("password") : "";

    Optional<User> userOpt = userRepository.findAll().stream()
      .filter(u -> u.getEmail() != null && u.getEmail().trim().equalsIgnoreCase(email))
      .findFirst();

    if (userOpt.isPresent() && userOpt.get().getPasswordHash().equals(password)) {
      User user = userOpt.get();

      return ResponseEntity.ok(Map.of(
        "userId", user.getUserId(),
        "firstName", user.getFirstName() != null ? user.getFirstName() : "",
        "lastName", user.getLastName() != null ? user.getLastName() : "",
        "email", user.getEmail()
      ));
    }

    return ResponseEntity
      .status(HttpStatus.UNAUTHORIZED)
      .body(Map.of("message", "Invalid email or password."));
  }

  @PostMapping("/register")
  @Transactional
  public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
    String firstName = payload.get("firstName") != null ? payload.get("firstName").trim() : "";
    String lastName = payload.get("lastName") != null ? payload.get("lastName").trim() : "";
    String gender = payload.get("gender") != null ? payload.get("gender").trim() : null;
    String dobStr = payload.get("dateOfBirth") != null ? payload.get("dateOfBirth").trim() : "";
    String email = payload.get("email") != null ? payload.get("email").trim() : "";
    String password = payload.get("password") != null ? payload.get("password") : "";

    if (firstName.isEmpty() || lastName.isEmpty() || email.isEmpty() || password.isEmpty()) {
      return ResponseEntity
        .badRequest()
        .body(Map.of("message", "First name, last name, email, and password are required."));
    }

    boolean emailExists = userRepository.findAll().stream()
      .anyMatch(u -> u.getEmail() != null && u.getEmail().trim().equalsIgnoreCase(email));

    if (emailExists) {
      return ResponseEntity
        .status(HttpStatus.CONFLICT)
        .body(Map.of("message", "An account with this email already exists."));
    }

    User newUser = new User();
    newUser.setFirstName(firstName);
    newUser.setLastName(lastName);
    newUser.setGender(gender != null && !gender.isEmpty() ? gender : null);
    newUser.setDateOfBirth(!dobStr.isEmpty() ? LocalDate.parse(dobStr) : null);
    newUser.setEmail(email);
    newUser.setPasswordHash(password);

    User savedUser = userRepository.save(newUser);

    // Auto-create initial personal Applicant profile for this user
    Applicant personalApplicant = new Applicant();
    personalApplicant.setApplicantName(firstName + " " + lastName);
    personalApplicant.setUser(savedUser);
    personalApplicant.setCompany(null);
    applicantRepository.save(personalApplicant);

    Map<String, Object> response = new HashMap<>();
    response.put("userId", savedUser.getUserId());
    response.put("firstName", savedUser.getFirstName());
    response.put("lastName", savedUser.getLastName());
    response.put("email", savedUser.getEmail());

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}
