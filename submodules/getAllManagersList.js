import { AppDataSource } from '../db/index.js';
import { EmployeeData } from '../db/models/employeeData.js';

async function fetchAllManagers() {
    const employeeRepository = AppDataSource.getRepository(EmployeeData);
  
    try {
      // Fetch distinct managers from the database
      const managers = await employeeRepository
      .createQueryBuilder('employee')
      .select(['employee.keka_display_name', 'employee.keka_emp_email'])
      .where('employee.keka_emp_email IN (' +
        'SELECT DISTINCT sub.keka_reporting_manager_email ' +
        'FROM employee_data sub' +
      ')')
      .andWhere('employee.keka_employment_status = :status', { status: 0 })
      .getMany();
  
      return managers.map(manager => ({
        name: manager.keka_display_name,
        email: manager.keka_emp_email
      }));
    } catch (error) {
      console.error('Error fetching managers:', error.message);
      throw new Error('Could not fetch managers list');
    }
  }


  async function getManagersListHandler(req, res) {
    try {
      // Fetch all managers' list
      const managersList = await fetchAllManagers();
  
      if (managersList.length === 0) {
        return res.status(404).json({ message: "No managers found" });
      }
  
      return res.status(200).json({
        message: "Managers list fetched successfully",
        data: managersList,
      });
    } catch (error) {
      console.error("Error handling /get-all-managers request:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

export {getManagersListHandler}
  