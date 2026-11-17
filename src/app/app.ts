import { Component, OnInit } from '@angular/core';
import {ApplicationService} from './services/application';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  title = 'My Applications Dashboard';

  applications: any[] = [];

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.applicationService.getApplications().subscribe((data) => {
      this.applications = data;
      console.log(data);
    });
  }
}
