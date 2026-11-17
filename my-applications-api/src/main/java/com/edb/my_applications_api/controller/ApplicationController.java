package com.edb.my_applications_api.controller;

import com.edb.my_applications_api.entity.Application;
import com.edb.my_applications_api.repository.ApplicationRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/applications")
@CrossOrigin(origins = "http://localhost:4200")
public class ApplicationController {

    private final ApplicationRepository repository;

    public ApplicationController(ApplicationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Application> getAllApplications() {
        return repository.findAll();
    }
}