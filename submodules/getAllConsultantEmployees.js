import { AppDataSource } from '../db/index.js';
import { EmployeeData } from '../db/models/employeeData.js';


async function fetchEmployeesByJobTitle() {
    const employeeRepository = AppDataSource.getRepository(EmployeeData);
  
    try {
      const employees = await employeeRepository
        .createQueryBuilder("employee")
        .select([
          "employee.keka_job_title",
          "employee.keka_display_name",
          "employee.keka_emp_email",
          "employee.keka_reporting_manager_email",
        ])
        .where("employee.keka_job_title ILIKE :jobTitle", { jobTitle: 'Consultant%' }) // Case-insensitive match
        .getMany();
  
      return employees;
    } catch (error) {
      console.error("Error fetching employees by job title:", error.message);
      throw new Error("Could not fetch employees");
    }
  }
  
async function getAllConsultantEmployees(req, res) {
    try {
      // Fetch employees with job title starting with "Consultant"
      const employeesList = await fetchEmployeesByJobTitle();
  
      if (employeesList.length === 0) {
        return res.status(404).json({ message: "No employees found with job title starting with 'Consultant'" });
      }
  
      return res.status(200).json({
        message: "Employees list fetched successfully",
        data: employeesList.map(employee => ({
          jobTitle: employee.keka_job_title,
          displayName: employee.keka_display_name,
          email: employee.keka_emp_email,
          reportingManagerEmail: employee.keka_reporting_manager_email,
        })),
      });
    } catch (error) {
      console.error("Error handling /get-consultant-employees request:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  
export {getAllConsultantEmployees}