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
          select: ['keka_id','keka_display_name', 'keka_emp_email', 'keka_reporting_manager_email'],
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

// Endpoint to fetch manager hierarchy
async function managerDataHandler(req, res) {
    try {
      const { managerName } = req.body;
  
      if (!managerName) {
        return res.status(400).json({ error: "Manager name is required" });
      }
  
      // Fetch the hierarchy data
      const hierarchyData = await fetchManagerHierarchyByName(managerName);
  
      if (hierarchyData.length === 0) {
        return res.status(404).json({ message: "No managers found under this name" });
      }
  
      return res.status(200).json({
        manager: managerName,
        hierarchy: hierarchyData,
      });
    } catch (error) {
      console.error("Error handling /get-managers request:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }


export {managerDataHandler}