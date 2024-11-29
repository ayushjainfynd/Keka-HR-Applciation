import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AppDataSource } from '../db/index.js';
import { EmployeeData } from '../db/models/employeeData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const employeeRepository = AppDataSource.getRepository(EmployeeData);

/**
 * Recursive function to fetch employees under a manager based on `keka_reporting_manager_email`
 */
async function getEmployeesUnderManager(managerEmail, employees = [], parentKey = null) {
  try {
    // Fetch all employees reporting to the manager
    const directReports = await employeeRepository.find({
      where: { keka_reporting_manager_email: managerEmail, keka_employment_status: 0 },
      select: [
        'keka_id',
        'keka_display_name',
        'keka_emp_email',
        'keka_job_title',
        'keka_department',
        'keka_office_location',
      ],
    });

    let totalReporteesCount = 0; // Initialize total reportees count for the current manager

    // Process each direct report
    for (const report of directReports) {
      const employee = {
        key: report.keka_id,
        name: report.keka_display_name,
        title: report.keka_job_title,
        dept: report.keka_department,
        pic: '',
        email: report.keka_emp_email,
        phone: report.keka_office_location || '',
        directReportees: 0, // Placeholder, will be updated
        totalReportees: 0, // Placeholder, will be updated
        parent: parentKey ? parentKey.toString() : null,
      };

      employees.push(employee); // Add this employee to the list

      // Recursively fetch subordinates
      const subReportees = await getEmployeesUnderManager(report.keka_emp_email, employees, report.keka_id);

      // Update `directReportees` and `totalReportees`
      employee.directReportees = subReportees.filter(sub => sub.parent === employee.key.toString()).length;
      employee.totalReportees = subReportees.reduce(
        (sum, sub) => sum + (sub.parent === employee.key.toString() ? 1 + sub.totalReportees : 0),
        0
      );

      totalReporteesCount += 1 + employee.totalReportees; // Add this employee and all their subordinates
    }

    return employees; // Always return the full employees array
  } catch (error) {
    console.error(`Error fetching employees under manager email: ${managerEmail}`, error.message);
    throw error;
  }
}

/**
 * Handler for `/get-org-chart` endpoint
 */
const getOrgChartHandler = async (req, res) => {
  const managerId = req.query.managerid;

  if (!managerId) {
    return res.status(400).json({ error: 'Manager ID is required.' });
  }

  try {
    // Fetch the manager's email using their ID
    const manager = await employeeRepository.findOne({
      where: { keka_id: managerId },
      select: ['keka_emp_email', 'keka_display_name', 'keka_job_title', 'keka_department'],
    });

    if (!manager) {
      return res.status(404).json({ error: 'Manager not found.' });
    }

    // Manager's root node
    const orgChartRoot = {
      key: managerId,
      name: manager.keka_display_name,
      title: manager.keka_job_title,
      dept: manager.keka_department,
      email: manager.keka_emp_email,
      pic: '',
      phone: '',
      directReportees: 0, // Placeholder, will be updated
      totalReportees: 0, // Placeholder, will be updated
    };

    // Fetch the hierarchy
    const employees = await getEmployeesUnderManager(manager.keka_emp_email, [orgChartRoot], orgChartRoot.key);

    // Update `directReportees` and `totalReportees` for the root node
    orgChartRoot.directReportees = employees.filter(emp => emp.parent === orgChartRoot.key.toString()).length;
    orgChartRoot.totalReportees = employees.reduce(
      (sum, emp) => (emp.parent === orgChartRoot.key.toString() ? sum + 1 + emp.totalReportees : sum),
      0
    );

    // Generate the GoJS model JSON
    const orgChart = {
      class: 'go.TreeModel',
      nodeDataArray: employees,
    };

    // Render the EJS template and pass the JSON
    res.render('orgChart', { orgChart });
  } catch (error) {
    console.error('Error handling /get-org-chart request:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export { getOrgChartHandler };
