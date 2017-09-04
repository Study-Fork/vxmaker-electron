import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { UUID } from 'angular2-uuid';
import { BroadcastService } from './broadcast.service';

declare var electron: any;
declare var html_beautify: any;
declare var js_beautify: any;
declare var css_beautify: any;





@Injectable()
export class ApplicationDataServiceService {


  activityId: String;
  applicationFolderPath: string;
  applicationData;
  activityMetaData;
  activityData;

  selectedObject;
  hoverObject;

  selectedStage;
  selectedState;

  selectedTriggerEvent;
  selectedImplementEvent;


  objectTypeData = [];
  defaultStateData;

  imageResourceList;
  fileResourceList;

  deviceList = [];



  zoom = 0.2;

  templeteFolderPath = './assets/template';
  templateHash = {};



  parsePsdPromise: any;


  lastId = 0;
  idHash = {};



  constructor(private http: Http, private broadcaster: BroadcastService) {

    const self = this;
    electron.ipcRenderer.on('parse-psd-result', (event, arg) => {
      this.parsePsdPromise(arg);
    });

  }





  parsePsdFile(psdFilePath, applicationFolderPath) {
    return new Promise((resolve, reject) => {
      this.parsePsdPromise = resolve;
      electron.ipcRenderer.sendSync('parse-psd', psdFilePath, applicationFolderPath);
    });
  }




  initApplicationPath(applicationFolderPath) {
    this.applicationFolderPath = applicationFolderPath;
  }
  initActivityId(activityId) {
    this.activityId = activityId;
  }


  getApplicationPath() {
    return this.applicationFolderPath;
  }

  openUrl(url) {
    electron.ipcRenderer.sendSync('open-url', url);
  }

  openMainWindowUrl(path) {
    console.log('path = ' + path);
    return electron.ipcRenderer.sendSync('go-main-window', path);
  }

  closeMainWindowUrl() {
    console.log('close main window');
    return electron.ipcRenderer.sendSync('close-main-window');
  }



  changeWindowSize(width, height, resizeable) {
    electron.ipcRenderer.sendSync('change-window', width, height, resizeable);
  }

  removeRecentProjectList() {
    const temp = {
      'applicationFolderPath': this.applicationFolderPath
    };
    electron.ipcRenderer.sendSync('remove-recent-project-list', temp);
  }

  addRecentProjectList(applicationName) {
    const historyData = {
      applicationFolderPath: this.applicationFolderPath,
      applicationName: applicationName,
    }
    electron.ipcRenderer.send('add-recent-project', historyData);
  }

  getRecentProjectList() {
    return JSON.parse(JSON.stringify(electron.ipcRenderer.sendSync('get-recent-project-list')));
  }

  saveApplicationData(applicationData) {
    electron.ipcRenderer.sendSync('save-file-data', this.applicationFolderPath + '/app.json', applicationData);
  }

  saveActivityData(activityId, activityData) {
    electron.ipcRenderer.sendSync('save-file-data', this.applicationFolderPath + '/activity/' + activityId + '.json', activityData);
  }

  deleteActivity(activityId) {
    electron.ipcRenderer.sendSync('delete-file', this.applicationFolderPath + '/activity/' + activityId + '.json');
  }





  selectPsdFile() {
    return electron.ipcRenderer.sendSync('select-psd-file');
  }

  selectImageFile() {
    return electron.ipcRenderer.sendSync('select-image-file');
  }

  selectImageFiles() {
    return electron.ipcRenderer.sendSync('select-image-files');
  }

  selectFile() {
    return electron.ipcRenderer.sendSync('select-file');
  }

  selectFiles() {
    return electron.ipcRenderer.sendSync('select-files');
  }

  selectWorkspaceFolderPath() {
    return electron.ipcRenderer.sendSync('select-workspace-folder-path');
  }

  readFileData(path) {
    return JSON.parse(JSON.stringify(electron.ipcRenderer.sendSync('read-file-data', path)));
  }

  deleteFile(path) {
    electron.ipcRenderer.sendSync('delete-file', path);
  }

  copyFile(src, dst) {
    electron.ipcRenderer.sendSync('copy-file', src, dst);
    return true;
  }







  makeSmallEnglish(origin) {
    let result = this.makeEnglish(origin.toLowerCase());
    if (!isNaN(parseInt(result[0], 10)) || result.length === 0 || result.startsWith('_')) {
      // Is a number
      result = 'image' + result;
    }
    return result;
  }

  makeEnglish(origin) {
    return origin.trim().replace(/\s/gi, '_').replace(/[^a-zA-Z0-9]/g, '_').replace('-', '_');
  }

  getUniqueActivityName(origin) {
    var result = this.makeEnglish(origin);
    if (!isNaN(parseInt(result[0], 10)) || result.length == 0 || result.startsWith('_')) {
      // Is a number
      result = "Activity" + result;
    }
    return this.getUniqueSourceName(result);
  }

  getUniqueResourceName(origin) {

    var result = this.makeSmallEnglish(origin);
    if (!isNaN(parseInt(result[0], 10)) || result.length == 0 || result.startsWith('_')) {
      // Is a number
      result = "resource" + result;
    }
    return this.getUniqueSourceName(result);
  }

  getUniqueLayoutName(origin) {

    var result = this.makeSmallEnglish(origin);
    if (!isNaN(parseInt(result[0], 10)) || result.length == 0 || result.startsWith('_')) {
      // Is a number
      result = "activity_" + result;
    }
    return this.getUniqueSourceName(result);
  }


  getUniqueSourceName(origin) {
    var result = origin;
    while (this.idHash[result]) {
      result = origin + "_" + this.lastId;
      this.lastId++;
    }
    this.idHash[result] = true;
    return result;
  }



  getUniuqeId(targetList, prefix) {
    if (prefix) {
      return this.getUniqueName(targetList, this.makeSmallEnglish(prefix));
    } else {
      return this.getUniqueName(targetList, 'id_');
    }
  }


  getUniqueName(targetList, origin) {
    let result = origin;
    let indexId = 0;
    while (this.contains(targetList, result)) {
      result = origin + '_' + indexId;
      indexId++;
    }
    targetList.push(result);
    return result;
  }


  getUniqueImageName(path) {
    let name = this.getFileName(path);
    const ext = this.getFileExt(path);
    name = this.getUniuqeId(this.imageResourceList, name);
    return name + ext;
  }

  getUniqueFileName(path) {
    let name = this.getFileName(path);
    const ext = this.getFileExt(path);
    name = this.getUniuqeId(this.fileResourceList, name);
    return name + ext;

  }




  contains(list, obj) {
    let i = list.length;
    while (i--) {
      if (this[i] === obj) {
        return true;
      }
    }
    return false;
  }





  getFileName(path) {
    return electron.ipcRenderer.sendSync('get-file-name', path);
  }

  getFileNameBase(path) {
    return electron.ipcRenderer.sendSync('get-file-name-base', path);
  }

  getFileExt(path) {
    return electron.ipcRenderer.sendSync('get-file-ext', path);
  }







  getHttpToJson(targetUrl) {
    return new Promise((resolve, reject) => {
      this.http.get(targetUrl).subscribe(res => {
        let data = res.json();
        resolve(data);
      });
    });
  }

  loadInitDataFromFile() {
    return new Promise((resolve, reject) => {
      //오브젝트 타입 정보 불러오기
      this.getHttpToJson('assets/object/object.json').then((data: any) => {
        const reqeustList = [];
        for (let i = 0; i < data.objectType.length; i++) {
          reqeustList.push(this.getHttpToJson('assets/object/' + data.objectType[i]));
        }
        this.defaultStateData = data.defaultState;
        return Promise.all(reqeustList);
      }).then((results: any) => {
        // console.log('results =' + JSON.stringify(results));
        this.objectTypeData = results;
        resolve(true);
      }).catch(function (err) {
        console.log('catch = ' + JSON.stringify(err));
        reject(err);
      });
    });
  }

  refreshDeviceList() {
    this.deviceList = electron.ipcRenderer.sendSync('get-device-list');
  }

  getDeviceList() {
    return this.deviceList;
  }


  getObjectTypeData() {
    return this.objectTypeData;
  }

  getDefaultStateData() {
    return this.defaultStateData;
  }



  getApplicationData() {
    return this.applicationData;
  }

  getActivityMetaData() {
    return this.activityMetaData;
  }

  getActivityData() {
    return this.activityData;
  }

  getObjectList() {
    return this.getAllObjectList(this.activityData.objectList);
  }

  getAllObjectList(targetList) {
    const result = [];
    for (let i = 0; i < targetList.length; i++) {
      const aObject = targetList[i];
      result.push(aObject);
      if (aObject.children && aObject.children.length > 0) {
        const childResult = this.getAllObjectList(aObject.children);
        for (let j = 0; j < childResult.length; j++) {
          result.push(childResult[j]);
        }
      }
    }
    return result;

  }

  saveRawFile(filePath, data) {
    electron.ipcRenderer.sendSync('save-raw-data', filePath, data);
  }

  loadApplicationData() {

    console.log('loadApplicationData -' + this.applicationFolderPath);
    return new Promise((resolve, reject) => {
      this.applicationData = electron.ipcRenderer.sendSync('read-file-data', this.applicationFolderPath + '/app.json');

      console.log('loadApplicationData done -' + JSON.stringify(this.applicationData));
      for (let i = 0; i < this.applicationData.activityList.length; i++) {
        const activity = this.applicationData.activityList[i];
        if (activity.activityId === this.activityId) {
          this.activityMetaData = activity;
          break;
        }
      }
      console.log('will read = this.activityId =' + this.activityId);
      this.activityData = electron.ipcRenderer.sendSync('read-file-data', this.applicationFolderPath + '/activity/' + this.activityId + '.json');
      resolve(true);
    });
  }

  loadTemplateString(file) {
    return new Promise((resolve, reject) => {
      if (this.templateHash[file]) {
        resolve(this.templateHash[file]);
      } else {
        this.http.get(this.templeteFolderPath + '/' + file)
          .subscribe(res => {
            this.templateHash[file] = res['_body'];
            resolve(this.templateHash[file]);
          });
      }
    });
  }













  readFileSync(filePath) {
    return electron.ipcRenderer.sendSync('read-file-data', this.applicationFolderPath + '/' + filePath);
  }


  readFile(filePath) {
    return new Promise((resolve, reject) => {
      const result = electron.ipcRenderer.sendSync('read-file-data', this.applicationFolderPath + '/' + filePath);
      resolve(result);
    });
  }

  readFileAbsolutePath(filePath) {
    return new Promise((resolve, reject) => {
      const result = electron.ipcRenderer.sendSync('read-file-data', filePath);
      resolve(result);
    });
  }


  setSelectedStage(value) {
    this.selectedStage = value;
    if (this.selectedObject) {
      this.selectedState = this.findStateByObjectId(this.selectedObject.id);
    }
  }

  setSelectedObject(value) {
    this.selectedObject = value;
    this.selectedState = this.findStateByObjectId(this.selectedObject.id);
  }


  setSelectedTriggerEvent(event) {
    this.selectedTriggerEvent = event;
  }

  setSelectedImplementEvent(event) {
    this.selectedImplementEvent = event;
  }


  getSelectedImplementEvent() {
    return this.selectedImplementEvent;
  }

  getSelectedTriggerEvent() {
    return this.selectedTriggerEvent;
  }

  getSelectedStage() {
    return this.selectedStage;
  }

  getSelectedObject() {
    return this.selectedObject;
  }

  getSelectedState() {
    return this.selectedState;
  }

  getAllSelectedState() {
    return this.findAllStateByStageId(this.selectedStage.id);
  }

  getImageSize(path) {
    return electron.ipcRenderer.sendSync('get-image-size', path);
  }







  createNewState(objectId: string, stageId: string, type: string) {
    const newState = {
      id: 'state_' + UUID.UUID(),
      objectId: objectId,
      stageId: stageId,
      width: 1440,
      height: 2560,
      marginTop: 0,
      marginLeft: 0,
      marginRight: 0,
      marginBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      translationX: 0,
      translationY: 0,
      scaleX: 1,
      scaleY: 1,
      rotate: 0,
      alpha: 1,
    };


    // fetch default state value
    const defaultObject = this.findObjectBasicDataByType(type);
    for (let i = 0; i < defaultObject.stateProperties.length; i++) {
      const aProperty = defaultObject.stateProperties[i];
      newState[aProperty.name] = aProperty.default;
    }
    return newState;
  }

  findObjectBasicDataByType(type: string) {
    for (let i = 0; i < this.objectTypeData.length; i++) {
      const aData = this.objectTypeData[i];
      if (type === aData.type) {
        return aData;
      }
    }
    return null;
  }

  findImplentEventByTriggerEventId(triggerEventId: string) {
    for (let i = 0; i < this.activityData.implementEventList.length; i++) {
      const aEvent = this.activityData.implementEventList[i];
      if (aEvent.triggerEventId === triggerEventId) {
        return aEvent;
      }
    }
    return null;
  }

  findTriggerEventByAfterTriggerEventId(implEventId: string) {
    for (let i = 0; i < this.activityData.triggerEventList.length; i++) {
      const aEvent = this.activityData.triggerEventList[i];
      if (aEvent.afterTriggerEventId && aEvent.afterTriggerEventId === implEventId) {
        return aEvent;
      }
    }
    return null;
  }



  deleteTriggerEventByTriggerEventId(triggerEventid: any) {
    let index = -1;
    for (let i = 0; i < this.activityData.triggerEventList.length; i++) {
      const aEvent = this.activityData.triggerEventList[i];
      if (aEvent.id === triggerEventid) {
        index = i;
        break;
      }
    }
    console.log('will delete = ' + index);
    if (index !== -1) {
      const removed = this.activityData.triggerEventList[index];
      this.activityData.triggerEventList.splice(index, 1);
      this.deleteImplementEventByTriggerEventId(removed.id);
    }
  }

  deleteTriggerEvent(triggerEvent: any) {
    this.deleteTriggerEventByTriggerEventId(triggerEvent.id);

  }

  deleteImplementEventByTriggerEventId(triggerEventId: string) {

    let index = -1;
    for (let i = 0; i < this.activityData.implementEventList.length; i++) {
      const aEvent = this.activityData.implementEventList[i];
      if (aEvent.triggerEventId === triggerEventId) {
        index = i;
        break;
      }
    }


    if (index !== -1) {
      const removed = this.activityData.implementEventList[index];
      this.activityData.implementEventList.splice(index, 1);
      if (removed.type === 'stageChange') {
        this.deleteStageChangeEventByImplementEventId(removed.id);
        this.deleteAfterAnimationEventByImplentEventId(removed.id);
      }
    }
  }


  deleteAfterAnimationEventByImplentEventId(implementEventId) {
    for (let i = 0; i < this.activityData.triggerEventList.length; i++) {
      const aEvent = this.activityData.triggerEventList[i];
      if (aEvent.afterTriggerEventId === implementEventId) {
        this.deleteTriggerEvent(aEvent);
      }
    }
  }

  deleteStageChangeEventByImplementEventId(implementEventId: string) {
    const afterArray = [];
    for (let i = 0; i < this.activityData.stateEventList.length; i++) {
      const aEvent = this.activityData.stateEventList[i];
      if (aEvent.implementEventId === implementEventId) {
        continue;
      }
      afterArray.push(aEvent);
    }
    this.activityData.stateEventList = afterArray;
  }


  findStateChangeEventByImplementEventId(implementEventId: string) {

    const result = [];
    for (let i = 0; i < this.activityData.stateEventList.length; i++) {
      const aEvent = this.activityData.stateEventList[i];
      if (aEvent.implementEventId === implementEventId) {
        result.push(aEvent);
      }
    }
    return result;
  }

  findStageByStageId(stageId) {
    for (let i = 0; i < this.activityData.stageList.length; i++) {
      if (stageId === this.activityData.stageList[i].id) {
        return this.activityData.stageList[i];
      }
    }
  }



  findObjectById(objectId: string) {
    return this.findObjectByIdWithList(this.activityData.objectList, objectId);
  }

  findObjectByIdWithList(targetList: any, objectId: string) {
    for (let i = 0; i < targetList.length; i++) {
      const aObject = targetList[i];
      if (aObject.id === objectId) {
        return aObject;
      }
      if (aObject.children && aObject.children.length > 0) {
        const childResult = this.findObjectByIdWithList(aObject.children, objectId);
        if (childResult) {
          return childResult;
        }
      }
    }
    return null;
  }


  findStateByObjectId(objectId: string) {
    return this.findStateByObjectIdWithStageId(objectId, this.selectedStage.id);
  }

  findAllStateByObjectId(objectId: string) {
    const result = [];
    for (let i = 0; i < this.activityData.stateList.length; i++) {
      const aState = this.activityData.stateList[i];
      if (aState.objectId === objectId) {
        result.push(aState);
      }
    }
    return result;
  }

  findStateByStateId(activityData, stateId: string) {
    for (let i = 0; i < activityData.stateList.length; i++) {
      const aState = activityData.stateList[i];
      if (aState.id === stateId) {
        return aState;
      }
    }
    return null;
  }




  findAllStateByStageId(stageId: string) {
    const result = [];
    for (let i = 0; i < this.activityData.stateList.length; i++) {
      const aState = this.activityData.stateList[i];
      if (aState.stageId === stageId) {
        result.push(aState);
      }
    }
    return result;
  }


  findStateByObjectIdWithStageId(objectId: string, stageId: string) {
    return this.findStateByObjectIdWithList(this.activityData.stateList, objectId, stageId);
  }

  findStateByObjectIdWithList(targetList: any, objectId: string, stageId: string) {
    for (let i = 0; i < targetList.length; i++) {
      const aState = targetList[i];
      if (aState.objectId === objectId && aState.stageId === stageId) {
        return aState;
      }
    }
    return null;
  }



  createNewObject(type) {

    const defaultObject = this.findObjectBasicDataByType(type);
    const newObject = {
      id: 'object_' + UUID.UUID(),
      canHaveChildren: false,
      isExpanded: true
    };

    for (let i = 0; i < defaultObject.objectProperties.length; i++) {
      const aProperty = defaultObject.objectProperties[i];
      newObject[aProperty.name] = aProperty.default;
    }

    if (newObject.canHaveChildren) {
      newObject['children'] = [];
    }
    return newObject;
  }



  setZoom(value) {
    this.zoom = value;
  }

  getZoom() {
    return this.zoom;
  }



  getObjectStyle(state) {
    const tempObjectData = this.findObjectById(state.objectId);
    const objectStyle = {
      'position': 'absolute',
      'width': state.width * this.zoom + 'px',
      'height': state.height * this.zoom + 'px',
      'background-color': tempObjectData.backgroundColor,
      'opacity': state.alpha * 0.8,
      'margin-left': this.getMarginLeft(state, tempObjectData) * this.zoom + 'px',
      'margin-top': this.getMarginTop(state, tempObjectData) * this.zoom + 'px',
    }
    return objectStyle;
  }


  getSelectedObjectStyle(state) {
    const tempObjectData = this.findObjectById(state.objectId);
    if (tempObjectData === null) {
      return {};
    }

    if (tempObjectData.id === 'root') {
      const objectStyle = {
        'position': 'absolute',
        'width': state.width * this.zoom + 'px',
        'height': state.height * this.zoom + 'px',
        'border': '0px solid grey',
        'margin-left': this.getMarginLeft(state, tempObjectData) * this.zoom + 'px',
        'margin-top': this.getMarginTop(state, tempObjectData) * this.zoom + 'px',
      };
      return objectStyle;
    } else {
      const objectStyle = {
        'position': 'absolute',
        'width': state.width * this.zoom + 'px',
        'height': state.height * this.zoom + 'px',
        'border': '1px solid gold',
        'margin-left': this.getMarginLeft(state, tempObjectData) * this.zoom + 'px',
        'margin-top': this.getMarginTop(state, tempObjectData) * this.zoom + 'px',
      };
      return objectStyle;
    }
  }


  deleteObjectChild(object, objectId) {
    const result = [];
    if (object.children && object.children.length > 0) {
      for (let i = 0; i < object.children.length; i++) {
        const aObject = object.children[i];
        if (objectId !== aObject.id) {
          result.push(aObject);
        }
        else {
          this.deleteObjectWithStateEvent(aObject);
        }
        if (aObject.children && aObject.children.length > 0) {
          this.deleteObjectChild(aObject, objectId);
        }
      }
    }
    object.children = result;
  }

  deleteObjectWithStateEvent(object) {

    this.deleteObjectState(object.id);
    this.deleteObjectEvent(object.id);
    if (object.children && object.children.length > 0) {
      for (let i = 0; i < object.children.length; i++) {
        this.deleteObjectWithStateEvent(object.children[i]);
      }
    }
  }


  deleteObjectState(objectId) {
    //remove state
    const stateresult = [];
    console.log('will remove state = ' + objectId);
    const targetStateList = this.activityData.stateList;
    for (let i = 0; i < targetStateList.length; i++) {
      const aState = targetStateList[i];
      if (aState.objectId === objectId) {
        continue;
      }
      stateresult.push(aState);
    }
    this.activityData.stateList = stateresult;

  }

  deleteObjectEvent(objectId) {
    //remove trigger event

    const triggerEventList = this.activityData.triggerEventList;
    for (let i = 0; i < triggerEventList.length; i++) {
      const aTrigger = triggerEventList[i];
      if (aTrigger.objectId === objectId) {
        this.deleteTriggerEvent(aTrigger);
        continue;
      }
    }
  }





  deleteObject(objectId) {

    const targetObject = this.findObjectById(objectId);
    const parentObject = this.findObjectById(targetObject.parentId);

    // const targetList = this.activityData.objectList;
    this.deleteObjectChild(this.activityData.objectList[0], objectId);
    this.setSelectedObject(parentObject);


  }




  getParentMarginLeft(targetObjectId) {

    const targetObject = this.findObjectById(targetObjectId);
    const tempState = this.findStateByObjectId(targetObjectId);
    if (targetObjectId === 'root') {
      return Number(tempState.marginLeft);
    } else {
      return Number(tempState.marginLeft) + this.getParentMarginLeft(targetObject.parentId);
    }
  }

  getParentMarginTop(targetObjectId) {
    const targetObject = this.findObjectById(targetObjectId);
    const tempState = this.findStateByObjectId(targetObject.id);
    if (targetObjectId === 'root') {
      return Number(tempState.marginTop);
    } else {
      return Number(tempState.marginTop) + this.getParentMarginTop(targetObject.parentId);
    }
  }

  getMarginLeft(state, objectData) {
    let totalMargin = state.marginLeft;
    if (objectData.id !== 'root') {
      totalMargin = Number(state.marginLeft) + this.getParentMarginLeft(objectData.parentId);
    }
    return totalMargin;
  }


  getMarginTop(state, objectData) {
    let totalMargin = state.marginTop;
    if (objectData.id !== 'root') {
      totalMargin = Number(state.marginTop) + this.getParentMarginTop(objectData.parentId);
    }
    return totalMargin;
  }


  getFileResourceList() {
    return this.fileResourceList;
  }

  loadFileResourceList() {
    return new Promise((resolve, reject) => {
      this.fileResourceList = electron.ipcRenderer.sendSync('get-file-list', this.applicationFolderPath + '/file');
      for (let i = 0; i < this.fileResourceList.length; i++) {
        this.fileResourceList[i] = 'file/' + this.fileResourceList[i];
      }
      resolve(this.fileResourceList);
    });
  }


  getImageResourceList() {
    return this.imageResourceList;
  }



  loadImageResourceList() {
    return new Promise((resolve, reject) => {
      this.imageResourceList = electron.ipcRenderer.sendSync('get-file-list', this.applicationFolderPath + '/image');
      console.log('from electron = ' + JSON.stringify(this.imageResourceList));
      if (!this.imageResourceList) {
        this.imageResourceList = [];
      }
      for (let i = 0; i < this.imageResourceList.length; i++) {
        this.imageResourceList[i] = 'image/' + this.imageResourceList[i];
      }
      resolve(this.imageResourceList);
    });
  }

  sendFileToDevice() {
    return new Promise((resolve, reject) => {
      const tarFilePath = electron.ipcRenderer.sendSync('tar-folder', this.applicationFolderPath);
      const sendResult = electron.ipcRenderer.sendSync('send-file-to-device', tarFilePath, this.deviceList[0], '/sdcard/vxmaker/vxmfiles/' + this.getFileName(this.applicationFolderPath) + '.tar');
      if (sendResult) {
        resolve(true);
      } else {
        reject(false);
      }
    });
  }








  makeActivitySource() {
    for (var i = 0; i < this.applicationData.activityList.length; i++) {
      var activity = this.applicationData.activityList[i];
      activity.activityName = this.getUniqueActivityName(activity.activityName);
      activity.layoutName = this.getUniqueLayoutName(activity.activityName);
    }
  }


  makeLayoutData() {
    return this.insertChild('root');
  }

  makeJavaData() {

    var variables = this.getActivityName(this.activityData.activityId + " context;\n");
    var finder = "";
    var eventString = "";

    for (var i = 0; i < this.activityData.activityList.length; i++) {
      var object = this.activityData.activityList[i];
      var tempVariableString = this.getViewClass(object.type) + " " + object.id + ";\n";
      var tempFinderString = object.id + " = (" + this.getViewClass(object.type) + ")findViewById(R.id." + object.id + ");\n";
      variables += tempVariableString;
      finder += tempFinderString;
    }


    // for (var i = 0; i < this.activityData.activityList.length; i++) {
    //   var objectData = this.activityData.activityList[i];


    //   //click event
    //   var eventList = [];
    //   for (var j = 0; j < data.animEvents.length; j++) {
    //     var checkEvent = data.animEvents[j];
    //     if (checkEvent.kind == 'click' && objectData.id == checkEvent.triggerObjectId) {
    //       eventList.push(checkEvent);
    //     }
    //   }
    //   if (eventList.length > 0) {
    //     var tempEventString =
    //       objectData.resourceId + ".setOnClickListener(new View.OnClickListener() {" +
    //       "\n@Override" +
    //       "\npublic void onClick(final View v) {";

    //     for (var j = 0; j < eventList.length; j++) {
    //       var event = eventList[j];

    //       var conditionString = null;
    //       if (event.conditions) {
    //         conditionString = this.getConditionString(event, data);
    //       }

    //       console.log("event = " + JSON.stringify(event));

    //       var triggerEvent = this.getEventById(event.triggerEventId, data);
    //       if (!triggerEvent) {
    //         continue;
    //       }


    //       var fireEventString = this.getEventFireString(triggerEvent, data);
    //       if (!fireEventString) {
    //         continue;
    //       }


    //       if (conditionString) {
    //         fireEventString = conditionString.replace('!!!eventString!!!', fireEventString)
    //       }
    //       tempEventString += "\n" + fireEventString + "\n";
    //     }

    //     tempEventString += "\n" +
    //       "\n}});";
    //     eventString += "\n" + tempEventString + "\n";
    //   }

    //   eventList = [];
    //   for (var j = 0; j < data.animEvents.length; j++) {
    //     var checkEvent = data.animEvents[j];
    //     if (checkEvent.kind == 'longClick' && objectData.id == checkEvent.triggerObjectId) {
    //       eventList.push(checkEvent);
    //     }
    //   }
    //   if (eventList.length > 0) {
    //     var tempEventString =
    //       objectData.resourceId + ".setOnLongClickListener(new View.OnLongClickListener() {" +
    //       "\n@Override" +
    //       "\npublic boolean onLongClick(final View v) {";

    //     for (var j = 0; j < eventList.length; j++) {
    //       var event = eventList[j];

    //       var conditionString = null;
    //       if (event.conditions) {
    //         conditionString = this.getConditionString(event, data);
    //       }

    //       var fireEventString = this.getEventFireString(this.getEventById(event.triggerEventId, data), data);

    //       if (conditionString) {
    //         fireEventString = conditionString.replace('!!!eventString!!!', fireEventString)
    //       }
    //       tempEventString += "\n" + fireEventString + "\n";
    //     }

    //     tempEventString += "\nreturn true;" +
    //       "\n}});";
    //     eventString += "\n" + tempEventString + "\n";
    //   }
    // }




    // //onCreate
    // var onCreateEventList = [];
    // for (var i = 0; i < data.animEvents.length; i++) {
    //   var checkEvent = data.animEvents[i];
    //   if (checkEvent.kind == 'onCreate') {
    //     onCreateEventList.push(checkEvent);
    //   }
    // }

    // console.log("onCreateEventList = " + onCreateEventList.length);
    // var onCreateEventString = "";
    // if (onCreateEventList.length > 0) {
    //   console.log("onCreateEventList2");
    //   for (var i = 0; i < onCreateEventList.length; i++) {
    //     var event = onCreateEventList[i];
    //     var fireEventString = this.getEventFireString(this.getEventById(event.triggerEventId, data), data);
    //     onCreateEventString += "\n" + fireEventString;
    //     console.log("onCreateEventList3");;
    //   }

    // }

    // console.log("onCreateEventList4");

    // var stageTemplateData = "";
    // if (this.needStageAnimationTemplate) {
    //   var stageTemplatePath = __dirname + "/template/source_template/StageAnimationFormat.java";
    //   stageTemplateData = fs.readFileSync(stageTemplatePath, 'utf-8');
    // }


    // var activityTemplatePath = __dirname + "/template/source_template/MainActivity.java";
    // var templateData = fs.readFileSync(activityTemplatePath, 'utf-8');

    //  let templateData = templateData.replace("!!!packageName!!!", this.packageName);
    //   templateData = templateData.replace("!!!activityName!!!", activityName);
    //   templateData = templateData.replace("!!!layoutName!!!", layoutName);
    //   templateData = templateData.replace("!!!variableList!!!", variables);
    //   templateData = templateData.replace("!!!variableFindList!!!", finder);
    //   templateData = templateData.replace("!!!eventList!!!", eventString);
    //   templateData = templateData.replace("!!!onCreateEvent!!!", onCreateEventString);
    //   templateData = templateData.replace("!!!stageAnimationFormat!!!", stageTemplateData);






  }


  getViewClass(origin) {
    if ("#" == origin) {
      return "FrameLayout";
    } else {
      return origin;
    }
  }

  makeBeautifyWithCount(source, line_length) {
    return html_beautify(source, { indent_size: 4, wrap_line_length: line_length });
  }

  makeBeautify(source) {
    return html_beautify(source, { indent_size: 4, wrap_line_length: 70 });
  }

  getActivityName(activityId) {

    for (let i = 0; i < this.applicationData.activityList.length; i++) {
      const aActivity = this.applicationData.activityList[i];
      if (activityId === aActivity.activityId) {
        return aActivity.activityName;
      }
    }
    return null;

  }



  insertChild(objectId) {
    console.log('insertChild = ' + objectId);
    let xmlString = '';

    const object = this.findObjectById(objectId);
    if (object) {
      const state = this.findStateByObjectId(objectId);
      if (state) {
        xmlString += this.getObjectString(object, state);
        if (object.children) {
          for (let i = 0; i < object.children.length; i++) {
            xmlString += this.insertChild(object.children[i].id);
          }
        }
        xmlString += '\n';
        xmlString += this.getCloseString(object);
      }
    }
    return xmlString;
  }
  pxToDp(px) {
    return px * (160 / 640);
  }


  getObjectString(object, state) {

    if (object.type === '#') {
      return '<FrameLayout\n' + this.getStateStringById(object, state) + '>\n';
    } else if (object.type === 'FrameLayout') {
      return '\n<FrameLayout\n' + this.getStateStringById(object, state) + '>\n';
    } else if (object.type === 'RelativeLayout') {
      return '\n<RelativeLayout\n' + this.getStateStringById(object, state) + '>\n';
    } else if (object.type === 'LinearLayout') {
      return '\n<LinearLayout\n' + this.getStateStringById(object, state) + '>\n';
    } else if (object.type === 'ScrollView') {
      return '\n<ScrollView\n' + this.getStateStringById(object, state) + '>\n';
    } else if (object.type === 'HorizontalScrollView') {
      return '\n<HorizontalScrollView\n' + this.getStateStringById(object, state) + '>\n';
    } else if (object.type === 'ImageView') {
      return '\n<ImageView\n' + this.getStateStringById(object, state) + ' />';
    } else if (object.type === 'Button') {
      return '\n<Button\n' + this.getStateStringById(object, state) + ' />';
    } else if (object.type === 'TextView') {
      return '\n<TextView\n' + this.getStateStringById(object, state) + ' />';
    } else if (object.type === 'EditText') {
      return '\n<EditText\n' + this.getStateStringById(object, state) + ' />';
    }
    console.log('getObjectString finish');

    return '';
  }


  getCloseString(object) {

    if (object.type === '#') {
      return '</FrameLayout >';
    } else if (object.type === 'FrameLayout') {

      return '</FrameLayout >';
    } else if (object.type === 'RelativeLayout') {

      return '</RelativeLayout >';
    } else if (object.type === 'LinearLayout') {

      return '</LinearLayout >';

    } else if (object.type === 'HorizontalScrollView') {

      return '</HorizontalScrollView >';

    } else if (object.type === 'ScrollView') {

      return '</ScrollView>';
    } else if (object.type === 'ImageView') {
      return '';
    }

    return '';
  }

  getStateStringById(object, state) {

    var result = '\n';
    if (state === null) {
      console.log('null state!!!');
    } else {

      result = '\nandroid:id=\"@+id/' + object.id + '\"\nandroid:tag=\"' + object.stateId + '\"\nandroid:layout_width=\"' + this.pxToDp(state.width) + 'dp\"\nandroid:layout_height=\"' + this.pxToDp(state.height) + 'dp\"\n';

      if (state.marginLeft) {
        result += 'android:layout_marginLeft=\"' + this.pxToDp(state.marginLeft) + 'dp\"\n';
      }
      if (state.marginTop) {
        result += 'android:layout_marginTop=\"' + this.pxToDp(state.marginTop) + 'dp\"\n';
      }


      if (state.translationX) {
        result += 'android:translationX=\"' + this.pxToDp(state.translationX) + 'dp\"\n';
      }
      if (state.translationY) {
        result += 'android:translationY=\"' + this.pxToDp(state.translationY) + 'dp\"\n';
      }

      if (state.alpha !== 1) {
        result += 'android:alpha=\"' + state.alpha + '\"\n';
      }


      if (state.scaleX !== 1) {
        result += 'android:scaleX=\"' + state.scaleX + '\"\n';
      }
      if (state.scaleY !== 1) {
        result += 'android:scaleY=\"' + state.scaleY + '\"\n';
      }

      //object data
      if (object.background) {

        result += 'android:background=\"' + object.background + '\"\n';
      }


      //TextView
      if (object.contentText) {
        result += 'android:text=\"' + object.contentText + '\"\n';
      }

      if (object.textColor) {

        result += 'android:textColor=\"' + object.textColor + '\"\n';
      }

      if (object.textSize) {
        result += 'android:textSize=\"' + object.textSize + 'sp\"\n';
      }

      //ImageView
      if (object.dataUrl) {
        result += 'android:scaleType=\"fitXY\"\n';
        result += 'android:src=\"@mipmap/' + object.dataUrl + '\"\n';
      }
    }
    console.log('getStateStringById done');
    return result;

  }






}
