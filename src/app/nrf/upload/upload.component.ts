import { Component,Input, Output,EventEmitter, OnInit } from '@angular/core';
import {AppService} from '../../app.service';

declare var jQuery:any;
@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {

 
  ngOnInit() {
  }

  constructor(private app: AppService) { 
  }

 @Output() changeConfig = new EventEmitter<any>();

 @Input() acceptInput: string = "image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
 @Input() attachTicket: boolean = true;
 showLoader: boolean = false;
 @Input() objectid: string = "";
 fileName: string = "Waiting...";
 activeColor: string = 'green';
 borderColor: string = "";
 baseColor: string = '#ccc';
 overlayColor: string = 'red'//rgba(255,255,255,0.5)';
 iconColor: string = 'rgba(255,255,255,0.5)';
 dragging: boolean = false;
 loaded: boolean = false;
 imageLoaded: boolean = false;
 imageSrc: string = '';
 isLoading: boolean = false;
 fileLoaded:boolean = false;
 file: any;
 

 closeWindow() { // Close the pop up window..
   this.changeConfig.emit({action: 1, data: null}); // One represents close the window telling the parent component to close window...
 }

 handleDragEnter() {
     this.dragging = true;
 }
 
 handleDragLeave() {
     this.dragging = false;
 }
 
 handleDrop(e) {
     e.preventDefault();
     this.dragging = false;
     this.handleInputChange(e);
 }
 
 handleImageLoad() {
     this.imageLoaded = true;
     this.iconColor = this.overlayColor;
 }

 handleInputChange(e) {
     this.file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];

     var pattern = /image-*/;
     var reader = new FileReader();

     this.fileName = this.file.name;
     this.loaded = true;
     if (this.file.type.match(pattern)) {
         reader.onload = this._handleReaderLoaded.bind(this);
         reader.readAsDataURL(this.file);
     }else{
         this.fileLoaded = true;
     }

     
 }

 
 _handleReaderLoaded(e) {
     var reader = e.target;
     this.imageSrc = reader.result;
     this.loaded = true;
 }
 
 _setActive() {
     this.borderColor = this.activeColor;
     if (this.imageSrc.length === 0) {
         this.iconColor = this.activeColor;
     }
 }
 
 _setInactive() {
     this.borderColor = this.baseColor;
     if (this.imageSrc.length === 0) {
         this.iconColor = this.baseColor;
     }
 }

 //Remove Attachment...
 _removeAttachment(){
         this.file = {};
         this.fileName = "Waiting...";
         this.fileLoaded = this.loaded = false;
         this.imageSrc = "";
 }

 //Upload attachment for current ticket into database..
 _uploadAttachment(){
     
     this.isLoading  = this.showLoader = true;
     let _self = this;
 
       

         let formData:FormData = new FormData();
         formData.append("images[]", this.file, this.fileName);
         formData.append("objectid", this.objectid);

     let xhr:XMLHttpRequest = new XMLHttpRequest();
     xhr.onreadystatechange = () => {
        
         if (xhr.readyState === 4) {
             if (xhr.status === 200) {
                 
                 var json = JSON.parse(xhr.responseText);
                  this.showLoader  = false;
                 if(!json.success){

                     jQuery.Notify({
                     caption: 'Error Uploading',
                     content: "Can't Upload " + xhr.responseText,
                     type: this.app.msg_codes.alert
                 });
                 }else{
                     this.imageSrc = "";
                     this.file = {};
                     this.fileName = "Waiting...";
                     this.fileLoaded = this.loaded = false;
                     this.isLoading = false;
                     jQuery.Notify({
                     caption: 'Upload',
                     content: "New File Attach",
                     type: this.app.msg_codes.success
                 });
                 }
                 
             } else {
                 jQuery.Notify({
                     caption: 'Error Uploading',
                     content: "Can't Upload " + xhr.responseText,
                     type: this.app.msg_codes.alert
                 });
                 
             }
         }

         setTimeout(function() {
             _self.showLoader = false;
         }, 100);
          
     };
     
       xhr.open('POST', "https://gis.lrgvdc911.org/excel/", true);

     xhr.send(formData);
     
 }

 maximizeMap() {

 }

 minimizedMap() {
     
 }

}
