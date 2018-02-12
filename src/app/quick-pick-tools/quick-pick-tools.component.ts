import { Component,Input, Output, EventEmitter, OnInit } from '@angular/core';
import {AppService} from "../app.service";

@Component({
  selector: 'app-quick-pick-tools',
  templateUrl: './quick-pick-tools.component.html',
  styleUrls: ['./quick-pick-tools.component.css']
})
export class QuickPickToolsComponent implements OnInit {

  @Input() toolsEnabled: boolean = false;
  @Input() attributes: any = null;
  @Output() closeOutput = new EventEmitter();
  @Input() pic: any = null;

  constructor(private app: AppService) { }

  ngOnInit() {
    // if(this.attributes) { // From Beginning
    //   this.pic = this.app.url + this.app.route.api.dQuickPick + this.attributes.filepath;
    // }
  }


  ngOnChange() {
    // console.log("I RAN");
    // if(this.attributes) { // If it changes '
    //   console.log("I CHANGE YES OR NO");
    //   this.pic = this.app.url + this.app.route.api.dQuickPick + this.attributes.filepath;
    // }
  }

  _onCloseWindow() {
    this.closeOutput.emit(false);
  }

}
