import { Component,
  OnChanges,
  SimpleChanges,Output,EventEmitter} from '@angular/core';
import { TokenStorage } from 'src/app/infrastructure/auth/jwt/token.service';
import { TourExecutionService } from '../tour-execution.service';
import { TourExecution } from '../model/tourExecution.model';
import { PagedResults } from 'src/app/shared/model/paged-results.model';
import { TourExecutionPosition } from '../model/tourExecutionPosition.model';

import { FormControl, FormGroup, Validators,AbstractControl } from '@angular/forms';
import { AdministrationService } from '../../administration/administration.service';
import { Router } from '@angular/router';
import { MapService } from 'src/app/shared/map/map.service';
import { UserPosition } from '../../administration/model/userPosition.model';



//import { MapComponent } from 'src/app/shared/map/map.component';

@Component({
  selector: 'xp-active-tour',
  templateUrl: './active-tour.component.html',
  styleUrls: ['./active-tour.component.css']
})
export class ActiveTourComponent implements OnChanges{
  activeTour: TourExecution;
  userId: number = this.tokenStorage.getUserId();
  shouldEdit:boolean
  idPosition:number|undefined
  tourId:number=0;
  @Output() positionUpdated=new EventEmitter<null>();
  
 // tourExecution:TourExecution
  constructor(private service:TourExecutionService,
              private tokenStorage: TokenStorage,
              private router:Router,
              private administrationService:AdministrationService,
              private mapService:MapService
             
      ){}

  ngOnInit(): void {
    this.checkUserPosition();
    this.getTourExecutionByUser(this.userId);
   
    //this.updatePosition();
    
    }

    ngOnChanges(changes: SimpleChanges): void {
      this.activeTourForm.reset();
      if (this.shouldEdit) {
        
        const formValues = {
        
        latitude: this.activeTour.position.latitude,
        longitude: this.activeTour.position.longitude,
      };
        this.activeTourForm.patchValue(formValues);
      }
    }
    activeTourForm = new FormGroup({
      latitude: new FormControl(0, [Validators.required]),
      longitude: new FormControl(0, [Validators.required]),
    });
  getTourExecution(userId: number){
    this.service.getById(userId).subscribe(
      (result) => {
        this.activeTour = result;
        console.log(this.activeTour); // Log the result to verify
        

        return result;
      },
      (error) => {
        console.error('Error fetching TourExecution', error);
      }
    );
  }

  getTourExecutionByUser(userId: number){
    this.service.getByUser(userId).subscribe(
      (result) => {
        this.activeTour = result;
        console.log(this.activeTour); // Log the result to verify
        this.tourId=this.activeTour.tourId;
      },
      (error) => {
        console.error('Error fetching TourExecution', error);
      }
    );

  }

  

  /*updatePosition(event: MouseEvent): void{
    console.log("usao");
    this.service.updatePosition(1,100, 100)
      .subscribe(
        () => {
          console.log('Position updated successfully');
        },
        (error) => {
          console.error('Error updating position', error);
        }
      );
  }*/
  //ready when backend change
  updatePosition(): void {
    var id = 0;
    const now = new Date();
    const tourExecutionPosition:TourExecutionPosition={
        tourExecutionId:this.activeTour.id,
        lastActivity:now,
        latitude:0,
        longitude:0

    }
  
    
    tourExecutionPosition.id=this.activeTour.position.id;
    this.mapService.coordinate$.subscribe((coordinates) => {
      tourExecutionPosition.latitude = parseInt(coordinates.lat.toFixed(0));
      tourExecutionPosition.longitude = parseInt(coordinates.lng.toFixed(0));
    });
  
    this.service.updatePosition(this.activeTour.id,tourExecutionPosition.latitude,tourExecutionPosition.longitude).subscribe({
      next: (_) => {
        this.positionUpdated.emit();
      },
    });
    
  }

  updateUserPosition(): void {
    var id = 0;
    const userPosition: UserPosition = {
      userId: this.tokenStorage.getUserId(),
      latitude: 0.000000,
      longitude: 0.000000,
    };
  
    this.administrationService.getByUserId(this.tokenStorage.getUserId(), 0, 0).subscribe(
      (result) => {
        this.idPosition = result ? result.id : undefined;
        // Handle the result as needed
      },
      (error) => {
        console.error('Error fetching user positions:', error);
        // Handle the error as needed
      }
    );
    userPosition.id=this.idPosition;
    this.mapService.coordinate$.subscribe((coordinates) => {
      userPosition.latitude = coordinates.lat;
      userPosition.longitude = coordinates.lng;
    });
  
    this.administrationService.updateUserPosition(userPosition).subscribe({
      next: (_) => {
        this.positionUpdated.emit();
      },
    });
  }

  updatePositions(event:MouseEvent):void{
    this.updatePosition();
    this.updateUserPosition();
  }

  updateStatusToAbandoned(): void{
    console.log("cap");
    this.service.updateStatus(this.activeTour.id,'Abandoned').subscribe(
      ()=>{
        console.log('Great');
      }
      );
    //this.updatePosition();
    this.router.navigate(['/home']);
  }

  checkUserPosition(): void {
    this.administrationService.getByUserId(this.tokenStorage.getUserId(), 0, 0).subscribe(
      (result) => {
        this.shouldEdit = result != null; 
        this.idPosition = result ? result.id : undefined; // Assign the result of the check
      },
      (error) => {
        console.error('Error fetching user positions:', error);
        // Handle the error as needed
      }
    );
  }
  

}
