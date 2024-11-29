import { AppDataSource } from '../db/index.js';
import { EmployeeData } from '../db/models/employeeData.js';

// Function to fetch all managers under a specific name in the hierarchy
async function fetchManagerHierarchyByName(managerId) {
  const employeeRepository = AppDataSource.getRepository(EmployeeData);
  const result = [];
  const visited = new Set(); // To track unique emails and avoid duplicates
  let initialEmail = null; // Store the initial manager's email to exclude later

  // Function to resolve manager's email from their display name
  async function resolveEmail(id) {
    try {
      const manager = await employeeRepository.findOne({
        where: { keka_id: id },
        select: ['keka_emp_email']
      });
      return manager?.keka_emp_email || null;
    } catch (error) {
      console.error(`Error resolving email for name: ${id}`, error.message);
      return null;
    }
  }

  // Recursive function to fetch the hierarchy
  async function findHierarchy(email) {
    try {
      const managers = await employeeRepository.find({
        where: { keka_reporting_manager_email: email },
        select: ['keka_display_name', 'keka_emp_email', 'keka_reporting_manager_email'],
      });

      for (const manager of managers) {
        if (!visited.has(manager.keka_emp_email) && manager.keka_emp_email !== initialEmail) {
          visited.add(manager.keka_emp_email); // Mark email as visited
          result.push(manager); // Add manager to results
          await findHierarchy(manager.keka_emp_email); // Recursive call
        }
      }
    } catch (error) {
      console.error(`Error fetching hierarchy for email: ${email}`, error.message);
    }
  }

  // Resolve the initial email for the given manager name
  initialEmail = await resolveEmail(managerId);

  if (!initialEmail) {
    throw new Error(`No email found for manager with id : ${managerId}`);
  }

  // Start fetching the hierarchy
  await findHierarchy(initialEmail);
  return result;
}

// Function to filter employees based on the criteria
async function filterEmployees(hierarchyData, businessUnit, department, jobTitle, kekaEmploymentStatus) {
  const employeeRepository = AppDataSource.getRepository(EmployeeData);
  const uniqueEmployees = new Map(); // Map to ensure uniqueness by email

  for (const manager of hierarchyData) {
    try {
      const employees = await employeeRepository.find({
        where: [
          { keka_reporting_manager_email: manager.keka_emp_email },
          { keka_emp_email: manager.keka_emp_email },
        ],
        select: [
          'keka_display_name',
          'keka_emp_email',
          'keka_job_title',
          'keka_business_unit',
          'keka_department',
          'keka_exit_status',
          'keka_employment_status',
          'updatedAt',
          'keka_reporting_manager_email'
        ],
      });

      for (const employee of employees) {
        if (!uniqueEmployees.has(employee.keka_emp_email)) {
          // Apply filters before adding
          if (
            (!businessUnit || employee.keka_business_unit.includes(businessUnit)) &&
            (!department || employee.keka_department.includes(department)) &&
            (jobTitle === "ALL" || (jobTitle === "Consultant" && employee.keka_job_title.includes("Consultant"))) &&
            employee.keka_employment_status === kekaEmploymentStatus
          ) {
            uniqueEmployees.set(employee.keka_emp_email, employee);
          }
        }
      }
    } catch (error) {
      console.error(`Error filtering employees for manager: ${manager.keka_display_name}`, error.message);
    }
  }

  return Array.from(uniqueEmployees.values()); // Convert map to an array
}

// Endpoint to fetch filtered employee data under a manager
async function filteredEmployeeDataHandler(req, res) {
  try {
    const { managerId, businessUnit, department, jobTitle, kekaEmploymentStatus } = req.body;

    if (!managerId) {
      return res.status(400).json({ error: "Manager is required" });
    }

    const hierarchyData = await fetchManagerHierarchyByName(managerId);

    if (hierarchyData.length === 0) {
      return res.status(404).json({ message: "No reportees found under the manager" });
    }

    const filteredEmployees = await filterEmployees(hierarchyData, businessUnit, department, jobTitle, kekaEmploymentStatus);

    if (filteredEmployees.length === 0) {
      return res.status(404).json({ message: "No employees found under this manager with the given filters" });
    }

    return res.status(200).json({
      manager: managerId,
      employees: filteredEmployees.map(employee => ({
        displayName: employee.keka_display_name,
        email: employee.keka_emp_email,
        jobTitle: employee.keka_job_title,
        businessUnit: employee.keka_business_unit,
        department: employee.keka_department,
        kekaExitStatus: employee.keka_exit_status,
        lastUpdatedAt: employee.updatedAt,
        kekaEmploymentStatus: employee.keka_employment_status,
        kekaReportingManagerEmail: employee.keka_reporting_manager_email
      })),
    });
  } catch (error) {
    console.error("Error handling /get-filtered-employees request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export { filteredEmployeeDataHandler };
