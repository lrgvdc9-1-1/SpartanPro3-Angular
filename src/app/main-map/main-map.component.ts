import { Component,ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import { AppService } from '../app.service';
import * as EXIF from "exif-js/exif"
import { MapServiceService } from '../map-service.service';


@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.css']
})
export class MainMapComponent implements OnInit, OnDestroy {

  // Global Variables..
  @ViewChild('map') mapObj:ElementRef; 
 
  // Esri Local Variables...
  map: any = null;
  mapFlexBase: any = null;
  rangesFeatureHCEW: any = null;
  rangesFeatureHCSN: any = null;
  rangesFeatureCEW: any = null;
  rangesFeatureCSN: any = null;
  rangesFeatureWWE: any = null;
  rangesFeatureWSN: any = null;
  skeletonFlexBase: any = null;
  templatePicker: any = null;
  myEditor: any = null;
  quickPickBase: any = null;
  quickPickView: any = null;
  graphicLayer: any = null;
  mapWMSBase: any = null;
  vectorSubBase: any = null;
  vectorArrBase: any = null;
  vecURL: string = "https://gis.lrgvdc911.org/arcgis106/rest/services/Hosted/MapFlex_Sub/VectorTileServer";
  mapflex: number = 0;
  wms: number = 1;
  google: number =2;
  vsub: number = 3;
  googleExtent: any = null;
  displayIdentify: boolean = false;
  displayBookmarks: boolean = false;
  dragging: boolean = false;
  files: Array<File>;
  fileName: string = "Waiting...";
  fileLoaded:boolean = false;
  pointSymbol: any = null; //holds the point symbol...
  polygonSymbol: any = null; // holds the polygon symbol....
  lineSymbol: any = null; // holds the polyline symbol..
  quickPickCollections: Array<any> = []; // Collect all the photos into array for future process...
  displayCollection: boolean = false;
  collectionIndex: number = 0;
  isAlive: boolean = true;
  displayGoogle: boolean = false;
  quickPickOnOff: boolean = true;
  measureDiv: any = null;
  measureTool: any = null;
  offsetbase: boolean = false;
  offsetsearch: boolean = false;
  extent_change: any = null;
  windmills: any = null;

  // =-=-= QUICK PICK TOOLS =-=-=-=-=-=
  quickPickEnabled: boolean = false;
  selectedAttributes: any = null;
  selectedPic: any = null;
  selectedQuickPick: any = null;
  enabledFullScreenPic: boolean = false;
  constructor(private app: AppService,private mapService: MapServiceService, private sanitizer: DomSanitizer) { }

  
  // Gets call by angular that is ready..
  ngOnInit() {

    //=-=-=-= REMOVE OVERFLOW BODY =-==-=
    let fluentHeader = document.getElementById("fluent-menu");
    
    document.body.style.overflow = 'hidden';

    // Setup the map Height....
    var map = document.getElementById("map");
    map.style.height = (window.innerHeight - 196) + "px";

    // =-=-= GOINT TO CONTROL ALL THE TOOL BAR ACTIONS =-=-=-=-=
    this.app.toolbarActions.takeWhile(() => this.isAlive).subscribe(action => {

        // Send it to map Service to make the decision...
       switch (action.action) {
        case this.app.toolbarActivies.MAP_IDENTIFY:
          this.mapService.iOn = true;
          this.map.setCursor("pointer")
          break;
        case this.app.toolbarActivies.MAP_MEASURE:
          // This is to show the map measure tool...
          var tool = document.getElementById("mtool");
          var style = tool.style.display;
          if(style == "none") {
            tool.style.display = "block";
          }
          else {
            tool.style.display = "none";
          }
          break;
        case this.app.toolbarActivies.COLLAPSE_TOOLBAR: // If toolbar collapse...

          if(action.data) {
            // Setup the map Height....
           var map = document.getElementById("map");
           map.style.height = (window.innerHeight - 196) + "px";
          }else {
            var map = document.getElementById("map");
          
            map.style.height = (window.innerHeight - 60) + "px";
          }
          
          break;
        case this.app.toolbarActivies.EDIT_RANGES:
          var edit = document.getElementById("contentEditor");
        
          var style = edit.style.visibility;
       
          if(style == "hidden") {
            edit.style.visibility = "visible";
          }
          else {
            edit.style.visibility = "hidden";
          }
          break;
        case this.app.toolbarActivies.BOOKMARK:
          this.displayBookmarks = true;
          break;
        case this.app.toolbarActivies.QUICK_PICK:
          this.quickPickOnOff = !this.quickPickOnOff;
          this.quickPickView.setVisibility(this.quickPickOnOff);
          break;
        default:
          break;
      }

    
    })

    // Setup some tools
    try {
      this.mapService.identifyObject = new this.app.esriIdentifyTask(this.app.mapFlexURLRanges);
      this.mapService.identifyParams = new this.app.esriIdentifyParams()
      //console.log(this.app.mapFlexBaseMap);
       //=-=-= INIT MAP =-=-=
      this.initMap();
    } catch (error) {
     // console.log(error);
      console.log("FAILED TO LOAD MAP")
    }
  
   
  }

  // Gets call when angular componenet is destroy

  ngOnDestroy() {
    document.body.style.overflow = 'auto';


     
    // Is Alive..
    this.isAlive = false;

    // Going to try to destroy object...
    try {
     
       // Destroy the measurement tool
       this.measureDiv.destroy();

       if(this.templatePicker) {
        this.templatePicker.destroy();
       }
       if(this.myEditor) {
        
         this.myEditor.destroy();
       }
       

      this.map.destroy(); // Destroy the map instance...
    } catch (error) {
      console.log("ERROR");
    }
    
  }




  // =-=-=-= INIT MAP =-=-=-=
  initMap() {

    let _self = this;
     // Setup PROXY IF NOT BEEN ALREADY this only applies to esri
     this.app.esriConfig.defaults.io.proxyUrl = this.app.proxyUrl

    // Start parser
   // this.app.esriParser.parse();

     // Create Map Object...
     this.map = new this.app.esriMap(this.mapObj.nativeElement,{
        center: [-98.181494, 26.208254], 
        zoom: 8,
        slider: false,
        isDoubleClickZoom: false
     });

     // TELL MAP TO DISABLE THE KEYBOARD NA
    this.map.disableKeyboardNavigation();
     // Create the measure Tool for esri map..
     this.measureTool = new this.app.esriDraw(this.map);


     this.measureDiv = new this.app.esriMeasurement({
      map: this.map
     }, document.getElementById("measurementDiv"));
    this.measureDiv.startup();

     // Set the map object..
     this.mapService.setMapObj(this.map);

     // FINISH THE INDENTIFY PARAMS.....
     this.mapService.identifyParams.tolerance = 3;
     this.mapService.identifyParams.returnGeometry = true;
     this.mapService.identifyParams.layerIds = [2, 8, 11, 26, 13, 32, 31];
     this.mapService.identifyParams.layerOption = this.app.esriIdentifyParams.LAYER_OPTION_ALL;
     this.mapService.identifyParams.width = this.map.width;
     this.mapService.identifyParams.height = this.map.height;


     // TESTING POINT SYMBOL
     this.pointSymbol = new this.app.esriSimpleMarkerSymbol(
      this.app.esriSimpleMarkerSymbol.STYLE_CIRCLE, 
      12, 
      new this.app.esriSimpleLineSymbol(
      this.app.esriSimpleLineSymbol.STYLE_SOLID,
      new this.app.esriColor([0, 0, 0]), 
      4
      ), 
      new this.app.esriColor([220,20,60])
      );

      this.lineSymbol = new this.app.esriSimpleLineSymbol(
        this.app.esriSimpleLineSymbol.STYLE_SOLID,
        new this.app.esriColor([0, 0, 0]), 
        4
        )


      this.polygonSymbol = new this.app.esriSimpleFillSymbol(this.app.esriSimpleFillSymbol.STYLE_SOLID,
          new this.app.esriSimpleLineSymbol(this.app.esriSimpleLineSymbol.STYLE_DASHDOT,
          new this.app.esriColor([0, 0, 0]), 4),new this.app.esriColor([12, 227, 172, 0.2])
          );


      // Create Dynamic Map..

      
        let config = this.app.account_info.config;
        let ranges_found = false;
        for(var x in config) {
           if(config[x].setting_type == "TOOLBAR") {
             let json  = config[x].json;
             if(json.SECTIONS.MAP.TOOLS.ids.EDIT_RANGES) {
              ranges_found = true;
              break;
             }
            
           }    
        }

        console.log(ranges_found)

       
        if(ranges_found) {
          this.mapFlexBase = new this.app.esriDynamicLayer(this.app.mapFlexURL);
        }else {
          this.mapFlexBase =  new this.app.esriDynamicLayer(this.app.mapFlexURLRanges);
        }
    
      
      this.skeletonFlexBase = new this.app.esriDynamicLayer("https://gis.lrgvdc911.org/arcgis2/rest/services/Dynamic/Adress_Streets/MapServer", {visible: false});
      //new this.app.esriDynamicLayer("https://gis.lrgvdc911.org/arcgis/rest/services/Dynamic/Adress_Streets/MapServer", {visible: false});
     
      if(ranges_found) {
        this.rangesFeatureHCEW = new this.app.esriFeature("https://gis.lrgvdc911.org/arcgis2/rest/services/Features/RangeFeature/FeatureServer/1")
        this.rangesFeatureHCSN = new this.app.esriFeature("https://gis.lrgvdc911.org/arcgis2/rest/services/Features/RangeFeature/FeatureServer/2")
        
        this.rangesFeatureCEW = new this.app.esriFeature("https://gis.lrgvdc911.org/arcgis2/rest/services/Features/RangeFeature/FeatureServer/3");
        this.rangesFeatureCSN = new this.app.esriFeature("https://gis.lrgvdc911.org/arcgis2/rest/services/Features/RangeFeature/FeatureServer/4");
        this.rangesFeatureWWE = new this.app.esriFeature("https://gis.lrgvdc911.org/arcgis2/rest/services/Features/RangeFeature/FeatureServer/5");
        this.rangesFeatureWSN = new this.app.esriFeature("https://gis.lrgvdc911.org/arcgis2/rest/services/Features/RangeFeature/FeatureServer/6");
      }

    


      // Create the WMS Layer Google Arieals.
       let layerInfo = new this.app.esriWMTSLayerInfo({identifier: 'texas', 
      titleMatrixSet: '0to20',format: 'png'});

      // Options For the WMS Layer..
      let options = {serviceMode: 'KVP', layerInfo: layerInfo, visible: false};
      
      // Create the WMS Layer GOOGLE ARIEALS>..
      this.mapWMSBase = new this.app.esriWMTSLayer(this.app.wmtsURL, options);
     

      this.quickPickBase = new this.app.esriGraphicsLayer();

      this.quickPickView = new this.app.esriGraphicsLayer();
      this.quickPickView.setMinScale(150000); // Set min Scale for the layer...
      this.graphicLayer = new this.app.esriGraphicsLayer();
      


      this.vectorArrBase = new this.app.esriVectorTileLayer("https://tiles.arcgis.com/tiles/HZn9sYWTEUxVRQW9/arcgis/rest/services/MapFlex_Arrows/VectorTileServer");
      this.vectorArrBase.hide();
      this.vectorSubBase = new this.app.esriVectorTileLayer("https://tiles.arcgis.com/tiles/HZn9sYWTEUxVRQW9/arcgis/rest/services/MapFlex_Sub2/VectorTileServer");//"https://gis.lrgvdc911.org/arcgis106/rest/services/Hosted/MapFlex_Sub/VectorTileServer", {credential: credential});
      this.vectorSubBase.hide();


      //if(this.app.ser)
      if(this.app.account_info.user_id == "12") {
        this.windmills = new this.app.esriFeature("https://gis.lrgvdc911.org/arcgis2/rest/services/Features/Turbines_Feature/FeatureServer/0", {outFields: ["hno", "prd", "stp", "rd", "sts", "pod", "status_address", "notes"]});//esriDynamicLayer("https://gis.lrgvdc911.org/arcgis2/rest/services/Dynamic/Turbines/MapServer");
      }else {
        this.windmills = new this.app.esriDynamicLayer("https://gis.lrgvdc911.org/arcgis2/rest/services/Features/Turbines_Feature/MapServer")
      }
      
      
      // Lets Load Layers to the map object...
      // add layer...
      this.map.addLayers([this.mapWMSBase,this.mapFlexBase, this.skeletonFlexBase, this.quickPickBase,this.quickPickView, this.graphicLayer, this.windmills, this.vectorSubBase,this.vectorArrBase, this.rangesFeatureHCEW, this.rangesFeatureHCSN, this.rangesFeatureCEW, this.rangesFeatureCSN, this.rangesFeatureWWE, this.rangesFeatureWSN]);
     


       // Setup Listeners...

       this.map.on("extent-change", object => {
       
        this.extent_change = object.extent.getExtent();
        let extent = this.app.esriwebMercatorUtils.webMercatorToGeographic(object.extent);
        this.getCameraLayer(extent.xmin, extent.ymin, extent.xmax, extent.ymax);
          // Time outs on extent change..
          setTimeout(() => {
            if(_self.mapService.iOn) {
              _self.map.setCursor("pointer");
            }
          }, 300);

       });

       this.map.on('layers-add-result', object => {
        
          var templateLayers =  [];
          var editorLayers = [];
          var size = object.layers.length;
          var layers = object.layers;
          for(var x =0; x < size; x++) {
            if(layers[x].layer['type'] == "Feature Layer") {
              templateLayers.push(layers[x].layer)
              editorLayers.push({ featureLayer: layers[x].layer })
            }
          }
       
          if(templateLayers.length > 0) { // We have feature layers for editing..
            this.templatePicker = new this.app.esriTemplatePicker({
              featureLayers: templateLayers,
              grouping: true,
              rows: "auto",
              columns: 4,
              style: "height: 94%; width:100%;overflow: auto"
            }, "picker");
            this.templatePicker.startup();


            var settings = {
              map: this.map,
              templatePicker: this.templatePicker,
              layerInfos: editorLayers,
              toolbarVisible: true,
              createOptions: {
                polylineDrawTools:[ this.app.esriEditor.CREATE_TOOL_FREEHAND_POLYLINE ],
                polygonDrawTools: [ this.app.esriEditor.CREATE_TOOL_FREEHAND_POLYGON,
                  this.app.esriEditor.CREATE_TOOL_CIRCLE,
                  this.app.esriEditor.CREATE_TOOL_TRIANGLE,
                  this.app.esriEditor.CREATE_TOOL_RECTANGLE
                ]
              },
              toolbarOptions: {
                reshapeVisible: true
              }
            };


            var params = { settings: settings };
            this.myEditor = new this.app.esriEditor(params, 'editor');
            this.myEditor.startup()
          }
       });

       this.map.on('click', object => {
          
        // Identifies layers..
        if(this.mapService.iOn) {
            this.mapService.identifyParams.geometry = object.mapPoint;
            this.mapService.identifyParams.mapExtent = this.map.extent;
            var deferred = this.mapService.identifyObject.execute(this.mapService.identifyParams).addCallback(response => {

               response.forEach(element => {
                  element.display = false;
               });

               this.mapService.identifyResponse = response;
               this.mapService.iOn = false;
               this.displayIdentify = true;
               this.map.setCursor("default");
            });

          }

       });
       

       //Quick Pick View Listener...
       // Add Click on quick pick ...
    this.quickPickView.on("click", response => {

      if(response) { // Is there response

        if(response.graphic) { // is there graphic from the response
          console.log("I AM CHANGING ATTRIBUTES");
          this.selectedAttributes = null;
          this.selectedAttributes = response.graphic.attributes; // Send attributes to quick pick tools..
          this.selectedPic = this.app.url + this.app.route.api.dQuickPick + response.graphic.attributes.filepath;
          this.quickPickEnabled = true; // Display quick pick tools
          // Draw square for selecting the graphic...
          let symbol = new this.app.esriSimpleMarkerSymbol(this.app.esriSimpleMarkerSymbol.STYLE_SQUARE, 35,
           new this.app.esriSimpleLineSymbol(this.app.esriSimpleLineSymbol.STYLE_SOLID,
           new this.app.esriColor([255,0,0]), 1),
           new this.app.esriColor([0,0,0,0.1]));
         this.map.graphics.clear();
         let graphic = new this.app.esriGraphic(response.graphic.geometry, symbol)
         this.map.graphics.add(graphic);

         this.app.animateGraphic(graphic);
       }
      }
   })

  }

  // =-=-=-=-=-=-= SELECTED DROP DOWN SEARCH =-=-=-=-=-=-=
  zoomToSelected(selected) {
     
    if(selected) {

    
     try {
        let geom = JSON.parse(selected.geometry);
      
        if(geom.type == "MultiPolygon") {
          let polygon = new this.app.esriPolygon(geom.coordinates[0]);
          this.graphicLayer.clear();
          this.graphicLayer.add(new this.app.esriGraphic(polygon, this.polygonSymbol));
          this.map.setExtent(polygon.getExtent())
        }
        else if(geom.type == "Point") {
          let point = new this.app.esriPoint(geom.coordinates, new this.app.esriSpatialReference({wkid: 4326}));
          this.graphicLayer.clear();
          this.graphicLayer.add(new this.app.esriGraphic(point, this.pointSymbol));
          
          let circle = this.app.esriCircle(point, {"radius": 300});
          
          this.map.setExtent(circle.getExtent());
        }else if(geom.type == "MultiLineString"){
        let line = new this.app.esriPolyline(geom.coordinates);
        this.graphicLayer.clear();
        this.graphicLayer.add(new this.app.esriGraphic(line, this.polygonSymbol));
        
        this.map.setExtent(line.getExtent());
        }

     } catch (error) {

      console.log(selected);
       console.log("SOMETHING HAPPEND SORRY");
     }

    }
    
  }


  // Zoom To Picture Selected...
  zoomPicture(item) {
    

    this.app.animateGraphic(item.graphic)

    let circle = this.app.esriCircle(item.pnt, {"radius": 300});
    
    this.map.setExtent(circle.getExtent());
  }

  zoomToExtent(extent) {
    var extent = this.app.esriExtent(extent.extent);
    this.map.setExtent(extent);
  }

  zoomToXY(event) {
   
    let point = new this.app.esriPoint([parseFloat(event.x), parseFloat(event.y)], new this.app.esriSpatialReference({wkid: 4326}));
    this.graphicLayer.clear();
    this.graphicLayer.add(new this.app.esriGraphic(point, this.pointSymbol));
    
    let circle = this.app.esriCircle(point, {"radius": 300});
    
    this.map.setExtent(circle.getExtent());

  }

  // =-=-=-= MODULE CLEAR MAP GRAPHICS IF NEEDED =-=-=-=
  clearMapGraphics() {
    this.map.graphics.clear();
  }


  // =-=-=-=-=-=-= CHANGE LAYERS =-=-=-=-
  changeBase(option) {

    // Always hide
      this.displayGoogle = false;
      this.offsetbase = false;
      this.offsetsearch = false;
      if(option == this.mapflex){
        
        this.mapFlexBase.show();
        this.skeletonFlexBase.hide();
        this.mapWMSBase.hide();
        this.vectorArrBase.hide();
        this.vectorSubBase.hide();
    
      }
      else if(option == this.wms) {
         this.mapFlexBase.hide();
         this.vectorSubBase.hide();
         this.vectorArrBase.hide();
         this.skeletonFlexBase.show();
         this.mapWMSBase.show();
      
      }
      else if(option == this.google) {
      
        // Offset Controls the movement of the search bar...
         this.offsetbase = true;
         this.offsetsearch = true;
         let extent = this.app.esriwebMercatorUtils.webMercatorToGeographic(this.map.extent);

         this.displayGoogle = true;
         this.googleExtent = extent;
      }
      else if(option == this.vsub) {
        
        this.mapFlexBase.hide();
        this.mapWMSBase.hide();
        this.vectorArrBase.hide();
        this.vectorSubBase.show();
      }else if(option == 4) {
        this.mapFlexBase.hide();
        this.mapWMSBase.hide();
        this.vectorSubBase.hide();
        this.vectorArrBase.show();
      }

  }

  //=-=-=-=-=-= REMOVE GRAPHICS FROM QPICK =-=-=-=-=
  removeQPick(graphic) {

    // REmove the selected graphic..
    this.quickPickBase.remove(graphic.graphic);
    this.displayCollection = (this.quickPickBase.graphics.length > 0) ? true : false; // If Less than 0 graphics then hide left panel..
  }


  // =-=-=-=-=-=-=-= THIS IS FOR DRAG AND DROP FILES TO VIEW ON MAP SUCH AS QUICK PICK =-=-=-=-=-=-=-=-=-=-=-=-=-=
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


    async handleInputChange(e) {

      let _self = this;
      this.files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
        var reader = new FileReader();

        // Once Loaded process
        reader.onload = this._handleReaderLoaded.bind(this);

    

      if(!this.displayCollection) {
        this.displayCollection = true;
      }

      if(this.files.length == 1) {

      
        // <<<<GET THE PICTURE NAME>>>>
        this.quickPickCollections.push({name: this.files[0].name});
      
        reader.readAsArrayBuffer(this.files[0]); 
      

      }else if(this.files.length > 1) {
          this.collectionIndex = 0;//this.files.length - 1;
          for(var i = 0; i < this.files.length; i++) {
             var promise = Promise.resolve();
            // console.log("HEY " + i)

             await this.pFileReader(this.files[i]).then(e => {
               
                _self._processMultiple(e, _self.files[_self.collectionIndex].name);
                _self.collectionIndex++;
             });
          
          }

      }
      
  }

 async pFileReader(file): Promise<any>{
    return await new Promise((resolve, reject) => {
      var fr = new FileReader();  
      fr.onload = resolve;  // CHANGE to whatever function you want which would eventually call resolve
      fr.readAsArrayBuffer(file);
    });
  }
 

  
 _processMultiple(e, name) {
  //  console.log(e)
  var reader = e.target;
    
  // GET EXIF BINARY FILE
  var exif = EXIF.readFromBinaryFile(reader.result);
  
  // GET GPS LONGY AND LAT
  var lng = this.toDecimal(exif.GPSLongitude, exif.GPSLongitudeRef);
  var lat = this.toDecimal(exif.GPSLatitude, exif.GPSLatitudeRef);
 
 // console.log(this);
  var pnt = new this.app.esriPoint(lng, lat);

  // Add to the current array.
  // From Blob array create URL
  var arrayBufferView = new Uint8Array( reader.result );
  var blob = new Blob( [ arrayBufferView ], { type: "image/jpeg" } );
  var urlCreator = window.URL;
  var imageUrl = urlCreator.createObjectURL( blob );
  let graphic = new this.app.esriGraphic(pnt, this.pointSymbol)
  this.quickPickCollections.push({graphic: graphic, pnt:  pnt, src: this.sanitizer.bypassSecurityTrustUrl(imageUrl), name: name});
 
  this.quickPickBase.add(graphic);
 }


  _handleReaderLoaded(e) {
    //  console.log(e)
     var reader = e.target;
    
     // GET EXIF BINARY FILE
     var exif = EXIF.readFromBinaryFile(reader.result);
    // console.log(exif);
     // GET GPS LONGY AND LAT
     var lng = this.toDecimal(exif.GPSLongitude, exif.GPSLongitudeRef);
     var lat = this.toDecimal(exif.GPSLatitude, exif.GPSLatitudeRef);
     
  
     var pnt = new this.app.esriPoint(lng, lat);

     // Add to the current array.
     // From Blob array create URL
     var arrayBufferView = new Uint8Array( reader.result );
     var blob = new Blob( [ arrayBufferView ], { type: "image/jpeg" } );
     var urlCreator = window.URL;
     var imageUrl = urlCreator.createObjectURL( blob );
    
     let name = this.quickPickCollections[this.quickPickCollections.length - 1]['name'];
     this.quickPickCollections[this.quickPickCollections.length - 1]['pnt'] = pnt;
     this.quickPickCollections[this.quickPickCollections.length - 1]['src'] = this.sanitizer.bypassSecurityTrustUrl(imageUrl); // this will fix the unsafe blob image..
     let graphic = this.quickPickCollections[this.quickPickCollections.length - 1]['graphic'] = new this.app.esriGraphic(pnt, this.pointSymbol, {name: name})
     //console.log(this.quickPickCollections);
     this.quickPickBase.add(graphic);
  }

    // Convert decimal degrees
    toDecimal(number, hemi) {
      var flip = (hemi == "W" || hemi == "S") ? -1 : 1;

      var response = number[0].numerator + number[1].numerator /
      (60 * number[1].denominator) + number[2].numerator / (3600 * number[2].denominator);


      return flip * response;
  };


  // Zoom And Flash...
  zoomAndFlash(feature) {

    // First all Graphics in the layer
    this.graphicLayer.clear();

   // What geometry type to check...
   switch (feature.geometry.type) {
     case new this.app.esriPoint().type:
       this.graphicLayer.add(new this.app.esriGraphic(feature.geometry, this.pointSymbol));
       let circle = this.app.esriCircle(feature.geometry, {"radius": 300});
       
       this.map.setExtent(circle.getExtent());
       break;
     case new this.app.esriPolyline().type:
        this.graphicLayer.add(new this.app.esriGraphic(feature.geometry, this.lineSymbol));
        this.map.setExtent(feature.geometry.getExtent())
        break;
     case new this.app.esriPolygon().type:
        this.graphicLayer.add(new this.app.esriGraphic(feature.geometry, this.polygonSymbol));
        this.map.setExtent(feature.geometry.getExtent())
        break;
     default:
       break;
   }
  }

  // GET CAMERA INFORMATION FROM SERVER =-=-=-=-=--=-
  getCameraLayer(xmin, ymin, xmax, ymax) {
    this.quickPickView.clear();
    this.app.POST_METHOD("qprocess/getBoxPics/", {data: { 
      xmin: xmin, ymin: ymin, xmax: xmax, ymax: ymax,
      orga: this.app.account_info.organization_id
         }}).subscribe((response:any) => {
          if(response.success) {
              let i = response.data.length;
              while(i--)
              {
                if(response.data[i].type == "H")
                {
                  this.quickPickView.add(new this.app.esriGraphic(new this.app.esriPoint(
                    response.data[i].x, response.data[i].y), this.app.cameraGraphics.HomeObj, response.data[i]
                  ));
                }
                else if(response.data[i].type == "B")
                {  
                    this.quickPickView.add(new this.app.esriGraphic(new this.app.esriPoint(
                    response.data[i].x, response.data[i].y), this.app.cameraGraphics.BusObj, response.data[i]));
                }
                else if(response.data[i].type == "M")
                {
                  this.quickPickView.add(new this.app.esriGraphic(new this.app.esriPoint(
                    response.data[i].x, response.data[i].y), this.app.cameraGraphics.MobileObj, response.data[i]));
                }
                else if(response.data[i].type == "F")
                {
                  this.quickPickView.add(new this.app.esriGraphic(new this.app.esriPoint(
                    response.data[i].x, response.data[i].y), this.app.cameraGraphics.FireObj, response.data[i]));
                }
                else if(response.data[i].type == "N")
                {
                  this.quickPickView.add(new this.app.esriGraphic(new this.app.esriPoint(
                    response.data[i].x, response.data[i].y), this.app.cameraGraphics.PicNewObj, response.data[i]));
                }
                else if(response.data[i].type == "S")
                {
                 this.quickPickView.add(new this.app.esriGraphic(new this.app.esriPoint(
                    response.data[i].x, response.data[i].y), this.app.cameraGraphics.StreetSignObj, response.data[i]));
                }
              }
          }
    });
}

    


}
