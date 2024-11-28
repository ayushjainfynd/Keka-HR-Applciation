import { AppDataSource } from '../db/index.js';
import { EmployeeData } from '../db/models/employeeData.js';

async function fetchAllBusinessUnits() {
    const employeeRepository = AppDataSource.getRepository(EmployeeData);
  
    try {
      const businessUnits = await employeeRepository
        .createQueryBuilder("employee")
        .select([
          "employee.keka_business_unit", // Fetch the business unit field
          "employee.keka_reporting_manager_email",
          "employee.keka_display_name"
        ])
        .distinctOn(["employee.keka_business_unit"]) // Ensure distinct business units
        .where("employee.keka_business_unit IS NOT NULL")
        .getMany();
  
      return businessUnits;
    } catch (error) {
      console.error("Error fetching all business units:", error.message);
      throw new Error("Could not fetch business units");
    }
  }

  
  async function getBusinessUnitsHandler(req, res) {
    try {
      // Fetch all business units
      const businessUnitsList = await fetchAllBusinessUnits();
  
      if (businessUnitsList.length === 0) {
        return res.status(404).json({ message: "No business units found" });
      }
  
      return res.status(200).json({
        message: "Business units list fetched successfully",
        data: businessUnitsList.map(unit => ({
          businessUnit: unit.keka_business_unit,
          reportingManagerEmail: unit.keka_reporting_manager_email,
          displayName: unit.keka_display_name
        })),
      });
    } catch (error) {
      console.error("Error handling /get-all-business-units request:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  
  export {getBusinessUnitsHandler}