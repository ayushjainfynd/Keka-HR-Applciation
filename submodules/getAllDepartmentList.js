import { AppDataSource } from '../db/index.js';
import { EmployeeData } from '../db/models/employeeData.js';

async function fetchAllDepartments() {
    const employeeRepository = AppDataSource.getRepository(EmployeeData);
  
    try {
      const departments = await employeeRepository
        .createQueryBuilder("employee")
        .select([
          "employee.keka_department", // Fetch the department field
          "employee.keka_reporting_manager_email",
          "employee.keka_display_name"
        ])
        .distinctOn(["employee.keka_department"]) // Ensure distinct departments
        .where("employee.keka_department IS NOT NULL")
        .getMany();
  
      return departments;
    } catch (error) {
      console.error("Error fetching all departments:", error.message);
      throw new Error("Could not fetch departments");
    }
  }

  async function getDepartmentsHandler(req, res) {
    try {
      // Fetch all departments
      const departmentsList = await fetchAllDepartments();
  
      if (departmentsList.length === 0) {
        return res.status(404).json({ message: "No departments found" });
      }
  
      return res.status(200).json({
        message: "Departments list fetched successfully",
        data: departmentsList.map(department => ({
          department: department.keka_department,
          reportingManagerEmail: department.keka_reporting_manager_email,
          displayName: department.keka_display_name
        })),
      });
    } catch (error) {
      console.error("Error handling /get-all-departments request:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

export {getDepartmentsHandler}
  