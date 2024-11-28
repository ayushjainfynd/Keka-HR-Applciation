import { AppDataSource } from '../db/index.js';
import { EmployeeData } from '../db/models/employeeData.js';

// Function to fetch all managers under a specific name in the hierarchy
async function fetchManagerHierarchyByName(managerName) {
  const employeeRepository = AppDataSource.getRepository(EmployeeData);
  const result = [];
  const visited = new Set();

  // Function to resolve manager's email from their display name
  async function resolveEmail(name) {
    try {
      // Find the manager by display name
      const manager = await employeeRepository.findOne({
        where: { keka_display_name: name },
        select: ['keka_emp_email'], // Correct field to fetch the email
      });

      return manager?.keka_emp_email || null; // Return the resolved email
    } catch (error) {
      console.error(`Error resolving email for name: ${name}`, error.message);
      return null;
    }
  }

  // Recursive function to fetch the hierarchy
  async function findHierarchy(email) {
    try {
      // Fetch employees reporting to the given email
      const managers = await employeeRepository.find({
        where: { keka_reporting_manager_email: email },
        select: ['keka_display_name', 'keka_emp_email', 'keka_reporting_manager_email'],
      });

      // Filter out already visited emails and add them to the result
      const newManagers = managers.filter(manager => !visited.has(manager.keka_emp_email));
      newManagers.forEach(manager => visited.add(manager.keka_emp_email));
      result.push(...newManagers);

      // Recursively fetch the hierarchy for subordinates
      for (const manager of newManagers) {
        await findHierarchy(manager.keka_emp_email);
      }
    } catch (error) {
      console.error(`Error fetching hierarchy for email: ${email}`, error.message);
    }
  }

  // Resolve the email for the given manager name
  const initialEmail = await resolveEmail(managerName);

  if (!initialEmail) {
    throw new Error(`No email found for manager name: ${managerName}`);
  }

  // Start fetching the hierarchy
  await findHierarchy(initialEmail);

  return result;
}

// Function to filter employees based on the criteria
async function filterEmployees(hierarchyData, businessUnit, department, jobTitle) {
  const employeeRepository = AppDataSource.getRepository(EmployeeData);

  // Filter the hierarchy data based on provided criteria
  const filteredEmployees = [];

  for (const manager of hierarchyData) {
    try {
      const employees = await employeeRepository.find({
        where: [
          { keka_reporting_manager_email: manager.keka_emp_email }, // Employees under this manager
          { keka_emp_email: manager.keka_emp_email }, // Including the manager themselves
        ],
        select: [
          'keka_display_name',
          'keka_emp_email',
          'keka_job_title',
          'keka_business_unit',
          'keka_department',
          'keka_exit_status',
          'updatedAt'
        ],
      });

      // Apply filters
      const filtered = employees.filter(employee => {
        let match = true;

        if (businessUnit && !employee.keka_business_unit.includes(businessUnit)) {
          match = false;
        }

        if (department && !employee.keka_department.includes(department)) {
          match = false;
        }

        // JobTitle Filtering
        if (jobTitle && jobTitle !== "ALL") {
          // If jobTitle is "Consultant", we check if it contains the word "Consultant"
          if (!employee.keka_job_title.includes("Consultant")) {
            match = false;
          }
        }

        return match;
      });

      filteredEmployees.push(...filtered);
    } catch (error) {
      console.error(`Error filtering employees for manager: ${manager.keka_display_name}`, error.message);
    }
  }

  return filteredEmployees;
}

// Endpoint to fetch filtered employee data under a manager
async function filteredEmployeeDataHandler(req, res) {
  try {
    const { managerName, businessUnit, department, jobTitle } = req.body;

    if (!managerName) {
      return res.status(400).json({ error: "Manager name is required" });
    }

    // Fetch the hierarchy data
    const hierarchyData = await fetchManagerHierarchyByName(managerName);

    if (hierarchyData.length === 0) {
      return res.status(404).json({ message: "No managers found under this name" });
    }

    // Filter the employees under the hierarchy
    const filteredEmployees = await filterEmployees(hierarchyData, businessUnit, department, jobTitle);

    if (filteredEmployees.length === 0) {
      return res.status(404).json({ message: "No employees found under this manager with the given filters" });
    }

    return res.status(200).json({
      manager: managerName,
      employees: filteredEmployees.map(employee => ({
        displayName: employee.keka_display_name,
        email: employee.keka_emp_email,
        jobTitle: employee.keka_job_title,
        businessUnit: employee.keka_business_unit,
        department: employee.keka_department,
        kekaExitStatus: employee.keka_exit_status,
        lastUpdatedAt: employee.updatedAt
      })),
    });
  } catch (error) {
    console.error("Error handling /get-filtered-employees request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export { filteredEmployeeDataHandler };
