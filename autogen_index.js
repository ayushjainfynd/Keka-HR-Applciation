// index.js - System Generated File

// This file is automatically generated by the system.
// For any changes, please refer to the appropriate configuration or script.

// Import the required modules
import express from 'express';
import bodyParser from 'body-parser';
import { managerDataHandler } from './submodules/managerData.js';
import { syncKekaDataHandler } from './submodules/syncKekaData.js'
import { frontPage } from "./submodules/frontPage.js";
import { getManagersListHandler } from './submodules/getAllManagersList.js';
import { getBusinessUnitsHandler } from './submodules/getAllBusinessUnitList.js';
import { getDepartmentsHandler } from './submodules/getAllDepartmentList.js';
import { getAllConsultantEmployees } from './submodules/getAllConsultantEmployees.js';
import { filteredEmployeeDataHandler } from './submodules/fetchFilteredEmployeeData.js';


// Define the port to listen on
const PORT = process.env.BOLT_APPLICATION_PORT || 3000;
const DEV_MODE = process.env.BOLT_DEVELOPMENT_MODE || false;

// Initialize the express application
const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
// parse text/plain
app.use(bodyParser.text())
// parse raw data
app.use(bodyParser.raw())


// Use the request handler function for all routes
app.all('/', frontPage);
app.all('/get-sync-data', syncKekaDataHandler);
app.all('/get-managers', managerDataHandler);
app.all('/get-all-managers-list',getManagersListHandler);
app.all('/get-all-business-units', getBusinessUnitsHandler);
app.all('/get-all-departments', getDepartmentsHandler);
app.all('/get-consultant-employees', getAllConsultantEmployees);
app.all('/get-filtered-employees', filteredEmployeeDataHandler);


// Start the server and listen on the defined port
app.listen(PORT, () => {
  if (DEV_MODE) {
    console.log(
      `Listening for events on port ${PORT} in development mode`
    );
  } else {
    console.log(
      `Listening for events`
    );
  }
});
