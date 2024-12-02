  import axios from 'axios';
  import { AppDataSource } from '../db/index.js';
  import { EmployeeData } from '../db/models/employeeData.js';
  import { ApiHitLog } from '../db/models/apiHitLog.js';


  const apiHitLogRepository = AppDataSource.getRepository(ApiHitLog);

  async function createTableIfNotExists() {
    try {
      const tableExists = await AppDataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'api_hit_log'
        )
      `);
  
      if (!tableExists[0].exists) {
        console.log("Creating table 'api_hit_log'...");
        await AppDataSource.query(`
          CREATE TABLE api_hit_log (
            id SERIAL PRIMARY KEY,
            time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          );
        `);
        console.log("Table 'api_hit_log' created successfully.");
      }
    } catch (error) {
      console.error('Error creating table:', error.message);
      throw error; // Rethrow error
    }
  }
  
  
  
  async function logApiHit() {
    try {
      // Ensure the table exists before logging
      await createTableIfNotExists();
  
      // Create a new log entry
      const newLog = apiHitLogRepository.create({
        time: new Date(),
      });
  
      // Save the log entry to the table
      const response = await apiHitLogRepository.save(newLog);
      console.log("API hit logged successfully:", response);
  
      return newLog;
    } catch (error) {
      console.error('Error logging API hit:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  
  
  // Function to get access token
  async function getAccessToken() {
    const url = "https://login.keka.com/connect/token";
    const payload = new URLSearchParams({
      'grant_type': 'kekaapi',
      'scope': 'kekaapi',
      'api_key': '+BPaVca4qzjFL2bDNEnobLdbm1EGt5FyBAlG57XEwRc=',
      'client_secret': 'yzFAodSaCk4XdzxUz3Ya',
      'client_id': '40d8e42e-fbbf-45d7-bfa1-0ad0df952f62'
    });

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data.access_token;
    } catch (error) {
      console.error("Error getting access token:", error.response ? error.response.data : error.message);
      return null;
    }
  }

  // Function to fetch employees
  async function getEmployees(token, probation, noticePeriod) {
    console.log("Starting getEmployees");

    let url = 'https://fynd.keka.com/api/v1/hris/employees';
    const headers = {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token,
    };

    let allCandidates = [];
    let pageNumber = 1;
    let hasNextPage = true;
    let counter = 0;
    const startTime = Date.now();

    while (hasNextPage) {
      console.log("Fetching page " + pageNumber);

      if (Date.now() - startTime < 60000 || counter < 50) {
        try {
            // const options = {
            //   'method': 'get',
            //   'headers': headers,
            //   'muteHttpExceptions': true
            // };
    
            console.log("Fetching via url " + url);
    
            // const response = await axios.get(url, { options });
          const response = await axios.get(url, { headers });
          counter++;

          if (response.status === 200) {
            const responseJson = response.data;
            allCandidates = allCandidates.concat(responseJson.data || []);
            
            console.log("Total pages fetched in api response " + responseJson.totalPages);
            console.log("First page fetched in api response " + responseJson.firstPage);
            console.log("Last page fetched in api response " + responseJson.lastPage);
            console.log("Previous page fetched in api response " + responseJson.previousPage);
            console.log("Next page fetched in api response " + responseJson.nextPage);

            hasNextPage = responseJson.nextPage || false;
            url = hasNextPage;
            pageNumber++;
          } else {
            console.log("Error: " + response.status + " " + response.data);
            break;
          }
        } catch (error) {
          console.error("Error fetching employee data:", error.response ? error.response.data : error.message);
          break;
        }
      }

      if (Date.now() - startTime > 50000 || counter === 50) {
        console.log("Waiting for 30 seconds to avoid rate limit...");
        await new Promise(resolve => setTimeout(resolve, 30000));  // sleep for 30 seconds
        counter = 0;
      }
    }

    return allCandidates;
  }

  // Function to extract title based on groupType
  function extractTitle(group, groupType) {
    for (let i = 0; i < group.length; i++) {
      if (group[i].groupType === groupType) {
        return group[i].title;
      }
    }
    return null;
  }

  // Function to extract reporting manager display name and ID
  function extractReportingManager(reportsTo) {
    if (reportsTo && typeof reportsTo === 'object') {
      const fullName = (reportsTo.firstName || '') + ' ' + (reportsTo.lastName || '');
      return {
        'name': fullName.trim(),
        'id': reportsTo.id
      };
    }
    return {
      'name': null,
      'id': null
    };
  }

  // Function to process employee data
  function processEmployeeData(data) {
    return data.map(emp => {
      return {
        Keka_Id: emp.employeeNumber,
        Keka_Joining_Date: emp.joiningDate,
        Keka_Display_Name: emp.displayName,
        Keka_emp_Email: emp.email,
        Keka_Business_Unit: emp.groups ? extractTitle(emp.groups, 1) : null,
        Keka_Department: emp.groups ? extractTitle(emp.groups, 2) : null,
        Keka_Job_Title: emp.jobTitle && emp.jobTitle.title ? emp.jobTitle.title : emp.jobTitle,
        Keka_Office_Location: emp.city,
        Keka_resignation_Submitted_Date: emp.resignationSubmittedDate,
        Keka_exit_Status: emp.exitStatus,
        Keka_Exit_Date: emp.exitDate,
        Keka_Reporting_Manager_Name: extractReportingManager(emp.reportsTo).name,
        Keka_Reporting_Manager_Email: emp.reportsTo ? emp.reportsTo.email : null,
        Keka_Employment_Status: emp.employmentStatus,
        Keka_Exit_Status: emp.exitStatus,
        Keka_Exit_Type: emp.exitType,
        Keka_ExitReason: emp.exitReason
      };
    });
  }

  // Function to insert employee data into the database
  async function insertEmployeeData(employeeList) {
    const employeeRepository = AppDataSource.getRepository(EmployeeData);

    try {
      // Check if the table exists
      const tableExists = await AppDataSource.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'employee_data'
        )`
      );

      if (!tableExists[0].exists) {
        throw new Error("Table 'employee_data' does not exist. Please create it first.");
      }

      // Truncate the table before inserting new data
      console.log("Truncating table 'employee_data'...");
      await AppDataSource.query('TRUNCATE TABLE employee_data');

      // Insert new data
      for (const employee of employeeList) {
        const newEmployee = employeeRepository.create({
          keka_id: employee.Keka_Id,
          keka_joining_date: employee.Keka_Joining_Date,
          keka_display_name: employee.Keka_Display_Name,
          keka_emp_email: employee.Keka_emp_Email,
          keka_business_unit: employee.Keka_Business_Unit,
          keka_department: employee.Keka_Department,
          keka_job_title: employee.Keka_Job_Title,
          keka_office_location: employee.Keka_Office_Location,
          keka_resignation_submitted_date: employee.Keka_resignation_Submitted_Date,
          keka_exit_status: employee.Keka_exit_Status,
          keka_exit_date: employee.Keka_Exit_Date,
          keka_reporting_manager_name: employee.Keka_Reporting_Manager_Name,
          keka_reporting_manager_email: employee.Keka_Reporting_Manager_Email,
          keka_employment_status: employee.Keka_Employment_Status,
          keka_exit_type: employee.Keka_Exit_Type,
          keka_exit_reason: employee.Keka_ExitReason,
        });

        await employeeRepository.save(newEmployee);
        console.log(`Employee ${employee.Keka_Id} inserted successfully.`);
      }
      console.log(`All Employees inserted successfully.`);
    } catch (error) {
      console.error('Error inserting employee data:', error.message);
    }
  }

  async function syncKekaData(req,res) {
    const token = await getAccessToken();
    if (!token) {
      return res.status(500).send("Unable to fetch access token");
    }

    const employeesData = await getEmployees(token, 'true', 'true');
    const processedData = processEmployeeData(employeesData);

    console.log("Processed Employee Data:", processedData);

    await insertEmployeeData(processedData);
    // res.status(200).json(`message: Data synced and saved successfully!`);
    console.log(employeesData[0]);
  }

  const syncKekaDataHandler = async (req, res) => {
    try {
      await syncKekaData(req, res);
  
      await logApiHit();

      return res.status(200).json(`Data synced and saved successfully!`);
      
    } 
      catch (error) {
        console.error('Error occurred during sync and logging:', error.message);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
      }
  };

  export {syncKekaDataHandler};