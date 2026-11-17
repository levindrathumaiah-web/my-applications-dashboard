package com.edb.my_applications_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "applications")
@Getter
@Setter
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic
    @Column(name = "applicationId")
    private Integer applicationId;

    @Column(name = "applicationNo")
    private String applicationNo;

    @ManyToOne
    @JoinColumn(name = "applicantId")
    private Applicant applicant;

    @ManyToOne
    @JoinColumn(name = "permitId")
    private Permit permit;

    @ManyToOne
    @JoinColumn(name = "transactionTypeId")
    private TransactionType transactionType;

    @ManyToOne
    @JoinColumn(name = "statusId")
    private Status status;

    @Column(name = "createdDate")
    private LocalDate createdDate;

    @Column(name = "submittedDate")
    private LocalDate submittedDate;

    public Application() {
    }
}



